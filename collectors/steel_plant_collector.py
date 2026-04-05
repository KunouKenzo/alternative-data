"""Steel Plant Activity Index collector using Sentinel-2 SWIR data.

Detects blast furnace / coke oven hot spots via B12 (SWIR2) band intensity,
following the TransitionZero methodology.

Usage:
    # Incremental (last 30 days):
    python collectors/steel_plant_collector.py

    # Custom date range:
    python collectors/steel_plant_collector.py --start 2024-01-01 --end 2024-03-31
"""

import argparse
import logging
import time
from datetime import datetime, timedelta, timezone

import ee
import pandas as pd

from collectors.base import BaseCollector
from collectors.steel_plant_config import (
    B12_NORM_CEILING,
    BAND_B11,
    BAND_B12,
    BAND_SCL,
    DATASET_ID,
    FACILITIES,
    GEE_COLLECTION,
    GEE_MONTH_SLEEP_SEC,
    GEE_PROJECT_ID,
    GEE_RETRY_BACKOFF,
    GEE_RETRY_MAX,
    GEE_SCALE,
    HOT_PIXEL_THRESHOLD,
    MAX_CLOUD_PERCENTAGE,
    QUALITY_GOOD_THRESHOLD,
    QUALITY_MARGINAL_THRESHOLD,
    SCL_VALID_CLASSES,
    SOURCE_ID,
    TABLE_DAILY,
    TABLE_MONTHLY,
    WEIGHT_B12,
    WEIGHT_HPR,
)

logger = logging.getLogger(__name__)


class SteelPlantCollector(BaseCollector):
    """Collect steel-plant activity indices from Sentinel-2 SWIR bands."""

    def __init__(self):
        super().__init__(source_id=SOURCE_ID, name="SteelPlantCollector")

    # ------------------------------------------------------------------
    # Supabase upsert with on_conflict
    # ------------------------------------------------------------------

    def _upsert_daily(self, rows: list[dict]) -> None:
        """Upsert daily rows with conflict resolution on (facility_id, image_date)."""
        if not rows:
            return
        self.supabase.table(TABLE_DAILY).upsert(
            rows, on_conflict="facility_id,image_date"
        ).execute()
        self.logger.info("Upserted %d rows into %s", len(rows), TABLE_DAILY)

    def _upsert_monthly(self, rows: list[dict]) -> None:
        """Upsert monthly rows with conflict resolution on (facility_id, year, month)."""
        if not rows:
            return
        self.supabase.table(TABLE_MONTHLY).upsert(
            rows, on_conflict="facility_id,year,month"
        ).execute()
        self.logger.info("Upserted %d rows into %s", len(rows), TABLE_MONTHLY)

    # ------------------------------------------------------------------
    # GEE initialisation
    # ------------------------------------------------------------------

    def _init_gee(self) -> None:
        """Authenticate and initialise the Earth Engine API."""
        try:
            ee.Initialize(project=GEE_PROJECT_ID)
            self.logger.info("GEE initialised (project=%s)", GEE_PROJECT_ID)
        except Exception:
            # Try default credentials / service account
            ee.Authenticate(auth_mode="gcloud")
            ee.Initialize(project=GEE_PROJECT_ID)
            self.logger.info("GEE initialised after re-auth (project=%s)", GEE_PROJECT_ID)

    # ------------------------------------------------------------------
    # GEE query – server-side computation
    # ------------------------------------------------------------------

    def _fetch_observations(
        self,
        facility_id: str,
        facility: dict,
        start_date: str,
        end_date: str,
    ) -> list[dict]:
        """Query GEE for SWIR stats within the facility AOI.

        Computes all pixel-level statistics server-side with reduceRegion(),
        then pulls results with a single getInfo() call.

        Returns list of row dicts ready for Supabase upsert.
        """
        sw = facility["aoi"]["sw"]
        ne = facility["aoi"]["ne"]
        aoi = ee.Geometry.Rectangle([sw[1], sw[0], ne[1], ne[0]])

        # Filter image collection
        collection = (
            ee.ImageCollection(GEE_COLLECTION)
            .filterDate(start_date, end_date)
            .filterBounds(aoi)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", MAX_CLOUD_PERCENTAGE))
        )

        # Server-side map: compute stats per image
        def compute_stats(image):
            """Compute SWIR statistics for a single Sentinel-2 scene."""
            date = image.date().format("YYYY-MM-dd")
            cloud_pct = image.get("CLOUDY_PIXEL_PERCENTAGE")

            # Clip to AOI
            clipped = image.clip(aoi)

            # Valid pixel mask from SCL
            scl = clipped.select(BAND_SCL)
            valid_mask = scl.eq(SCL_VALID_CLASSES[0])
            for cls in SCL_VALID_CLASSES[1:]:
                valid_mask = valid_mask.Or(scl.eq(cls))

            # Apply valid mask to SWIR bands
            b11 = clipped.select(BAND_B11).updateMask(valid_mask)
            b12 = clipped.select(BAND_B12).updateMask(valid_mask)

            # Hot pixel mask
            hot_mask = b12.gt(HOT_PIXEL_THRESHOLD)

            # Reduce: B11 mean
            b11_stats = b11.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=aoi,
                scale=GEE_SCALE,
                maxPixels=1e8,
            )

            # Reduce: B12 mean + max
            b12_stats = b12.reduceRegion(
                reducer=ee.Reducer.mean().combine(
                    ee.Reducer.max(), sharedInputs=True
                ),
                geometry=aoi,
                scale=GEE_SCALE,
                maxPixels=1e8,
            )

            # Hot pixel count
            hot_count = hot_mask.reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=aoi,
                scale=GEE_SCALE,
                maxPixels=1e8,
            )

            # Total valid pixel count
            total_count = valid_mask.reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=aoi,
                scale=GEE_SCALE,
                maxPixels=1e8,
            )

            # Total pixel count (including masked)
            all_pixels = (
                scl.gte(0)
                .reduceRegion(
                    reducer=ee.Reducer.count(),
                    geometry=aoi,
                    scale=GEE_SCALE,
                    maxPixels=1e8,
                )
            )

            # Use conditional to safely extract values (keys missing when all pixels masked)
            b11_key = ee.String(BAND_B11)
            b12_mean_key = ee.String(BAND_B12 + "_mean")
            b12_max_key = ee.String(BAND_B12 + "_max")
            b12_key = ee.String(BAND_B12)
            scl_key = ee.String(BAND_SCL)

            return ee.Feature(
                None,
                {
                    "image_date": date,
                    "cloud_pct": cloud_pct,
                    "b11_mean": ee.Algorithms.If(b11_stats.contains(b11_key), b11_stats.get(b11_key), None),
                    "b12_mean": ee.Algorithms.If(b12_stats.contains(b12_mean_key), b12_stats.get(b12_mean_key), None),
                    "b12_max": ee.Algorithms.If(b12_stats.contains(b12_max_key), b12_stats.get(b12_max_key), None),
                    "hot_pixel_count": ee.Algorithms.If(hot_count.contains(b12_key), hot_count.get(b12_key), 0),
                    "valid_pixel_count": ee.Algorithms.If(total_count.contains(scl_key), total_count.get(scl_key), 0),
                    "all_pixel_count": ee.Algorithms.If(all_pixels.contains(scl_key), all_pixels.get(scl_key), 0),
                },
            )

        features = collection.map(compute_stats)
        fc = ee.FeatureCollection(features)

        # Single getInfo() call to pull all results
        result = fc.getInfo()

        if not result or not result.get("features"):
            self.logger.info(
                "No images found for %s in %s to %s",
                facility_id, start_date, end_date,
            )
            return []

        # Build rows, dedup by image_date (multiple tiles may overlap the AOI)
        rows_by_date: dict[str, dict] = {}
        for feat in result["features"]:
            props = feat["properties"]
            row = self._build_row(facility_id, facility, props)
            if not row:
                continue
            date_key = row["image_date"]
            existing = rows_by_date.get(date_key)
            if existing is None:
                rows_by_date[date_key] = row
            else:
                # Keep the row with more hot pixels (better coverage of the facility)
                if (row.get("hot_pixel_count") or 0) > (existing.get("hot_pixel_count") or 0):
                    rows_by_date[date_key] = row

        rows = list(rows_by_date.values())
        self.logger.info(
            "Fetched %d observations for %s (%s to %s)",
            len(rows), facility_id, start_date, end_date,
        )
        return rows

    # ------------------------------------------------------------------
    # Row construction & scoring
    # ------------------------------------------------------------------

    def _build_row(self, facility_id: str, facility: dict, props: dict) -> dict | None:
        """Convert GEE feature properties into a Supabase row dict."""
        image_date = props.get("image_date")
        if not image_date:
            return None

        b12_mean = props.get("b12_mean")
        b12_max = props.get("b12_max")
        b11_mean = props.get("b11_mean")
        hot_count = props.get("hot_pixel_count")
        valid_count = props.get("valid_pixel_count")
        all_count = props.get("all_pixel_count")
        cloud_pct = props.get("cloud_pct")

        # Handle None values from cloudy / empty tiles
        if valid_count is None or valid_count == 0:
            return {
                "facility_id": facility_id,
                "facility_name": facility["name"],
                "ticker": facility.get("ticker"),
                "image_date": image_date,
                "year": int(image_date[:4]),
                "month": int(image_date[5:7]),
                "cloud_coverage_pct": cloud_pct,
                "valid_pixels_pct": 0.0,
                "data_quality": "poor",
                "hot_pixel_threshold": HOT_PIXEL_THRESHOLD,
                "source": GEE_COLLECTION,
            }

        total_pixel_count = int(valid_count)
        hot_pixel_count = int(hot_count) if hot_count else 0
        hot_pixel_ratio = hot_pixel_count / total_pixel_count if total_pixel_count > 0 else 0.0

        valid_pct = (valid_count / all_count * 100) if all_count and all_count > 0 else 100.0
        quality = self._quality_flag(valid_pct)

        activity_score = self._compute_activity_score(hot_pixel_ratio, b12_mean)

        return {
            "facility_id": facility_id,
            "facility_name": facility["name"],
            "ticker": facility.get("ticker"),
            "image_date": image_date,
            "year": int(image_date[:4]),
            "month": int(image_date[5:7]),
            "b12_mean": round(b12_mean, 2) if b12_mean is not None else None,
            "b12_max": round(b12_max, 2) if b12_max is not None else None,
            "b11_mean": round(b11_mean, 2) if b11_mean is not None else None,
            "hot_pixel_count": hot_pixel_count,
            "hot_pixel_ratio": round(hot_pixel_ratio, 6),
            "total_pixel_count": total_pixel_count,
            "activity_score": round(activity_score, 2),
            "hot_pixel_threshold": HOT_PIXEL_THRESHOLD,
            "cloud_coverage_pct": round(cloud_pct, 2) if cloud_pct is not None else None,
            "valid_pixels_pct": round(valid_pct, 2),
            "data_quality": quality,
            "source": GEE_COLLECTION,
        }

    @staticmethod
    def _compute_activity_score(hot_pixel_ratio: float, b12_mean: float | None) -> float:
        """Normalised activity score (0-100).

        score = (hot_pixel_ratio × WEIGHT_HPR) + (normalised_b12 × WEIGHT_B12)
        """
        hpr_component = hot_pixel_ratio * WEIGHT_HPR
        if b12_mean is not None and b12_mean > 0:
            norm_b12 = min(b12_mean / B12_NORM_CEILING, 1.0)
        else:
            norm_b12 = 0.0
        b12_component = norm_b12 * WEIGHT_B12
        return min(hpr_component + b12_component, 100.0)

    @staticmethod
    def _quality_flag(valid_pixels_pct: float) -> str:
        if valid_pixels_pct >= QUALITY_GOOD_THRESHOLD:
            return "good"
        if valid_pixels_pct >= QUALITY_MARGINAL_THRESHOLD:
            return "marginal"
        return "poor"

    # ------------------------------------------------------------------
    # Monthly aggregation
    # ------------------------------------------------------------------

    def _aggregate_monthly(self, facility_id: str) -> None:
        """Recompute monthly aggregates from daily data in Supabase."""
        resp = (
            self.supabase.table(TABLE_DAILY)
            .select("year, month, activity_score, hot_pixel_count")
            .eq("facility_id", facility_id)
            .eq("data_quality", "good")
            .order("image_date")
            .execute()
        )

        if not resp.data:
            return

        df = pd.DataFrame(resp.data)
        grouped = df.groupby(["year", "month"]).agg(
            activity_score_mean=("activity_score", "mean"),
            activity_score_max=("activity_score", "max"),
            activity_score_min=("activity_score", "min"),
            hot_pixel_count_mean=("hot_pixel_count", "mean"),
            valid_observation_count=("activity_score", "count"),
        ).reset_index()

        rows = []
        for _, r in grouped.iterrows():
            rows.append({
                "facility_id": facility_id,
                "year": int(r["year"]),
                "month": int(r["month"]),
                "activity_score_mean": round(float(r["activity_score_mean"]), 2),
                "activity_score_max": round(float(r["activity_score_max"]), 2),
                "activity_score_min": round(float(r["activity_score_min"]), 2),
                "hot_pixel_count_mean": round(float(r["hot_pixel_count_mean"]), 2),
                "valid_observation_count": int(r["valid_observation_count"]),
            })

        if rows:
            self._upsert_monthly(rows)
            self.logger.info(
                "Updated %d monthly rows for %s", len(rows), facility_id,
            )

    # ------------------------------------------------------------------
    # S3 export
    # ------------------------------------------------------------------

    def _export_daily_to_s3(self) -> None:
        """Export full daily table to S3."""
        resp = (
            self.supabase.table(TABLE_DAILY)
            .select("*")
            .order("image_date", desc=True)
            .execute()
        )
        if resp.data:
            df = pd.DataFrame(resp.data)
            self.export_to_s3(df, "steel-plant-activity")
            self.logger.info("Exported %d daily rows to S3", len(df))

    # ------------------------------------------------------------------
    # Main entry points
    # ------------------------------------------------------------------

    def collect(self) -> None:
        """Incremental collection: last 30 days for all facilities."""
        self._init_gee()

        end_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        start_date = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")

        total_rows = 0
        for fid, fac in FACILITIES.items():
            rows = self._fetch_observations(fid, fac, start_date, end_date)
            if rows:
                self._upsert_daily(rows)
                total_rows += len(rows)
            self._aggregate_monthly(fid)

        self._export_daily_to_s3()
        self.mark_success(total_rows)

    def collect_range(self, start_date: str, end_date: str) -> int:
        """Collect observations for an explicit date range.

        Processes month-by-month to keep GEE queries manageable.
        Returns total rows collected.
        """
        from dateutil.relativedelta import relativedelta

        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")

        total_rows = 0
        current = start.replace(day=1)

        while current <= end:
            month_end = current + relativedelta(months=1) - timedelta(days=1)
            if month_end > end:
                month_end = end

            chunk_start = max(current, start).strftime("%Y-%m-%d")
            chunk_end = (min(month_end, end) + timedelta(days=1)).strftime("%Y-%m-%d")

            for fid, fac in FACILITIES.items():
                for attempt in range(1, GEE_RETRY_MAX + 1):
                    try:
                        rows = self._fetch_observations(fid, fac, chunk_start, chunk_end)
                        if rows:
                            self._upsert_daily(rows)
                            total_rows += len(rows)
                        break
                    except Exception as exc:
                        wait = GEE_RETRY_BACKOFF * (2 ** (attempt - 1))
                        self.logger.warning(
                            "Attempt %d/%d failed for %s %s-%s: %s. Retrying in %ds...",
                            attempt, GEE_RETRY_MAX, fid,
                            chunk_start, chunk_end, exc, wait,
                        )
                        if attempt == GEE_RETRY_MAX:
                            self.logger.error(
                                "Giving up on %s for %s-%s", fid, chunk_start, chunk_end,
                            )
                        else:
                            time.sleep(wait)

            current += relativedelta(months=1)
            time.sleep(GEE_MONTH_SLEEP_SEC)

        return total_rows


# ------------------------------------------------------------------
# CLI entry point
# ------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Steel Plant Activity Collector")
    parser.add_argument("--start", help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end", help="End date (YYYY-MM-DD)")
    args = parser.parse_args()

    collector = SteelPlantCollector()

    if args.start and args.end:
        collector._init_gee()
        collector.start_run()
        try:
            total = collector.collect_range(args.start, args.end)
            for fid in FACILITIES:
                collector._aggregate_monthly(fid)
            collector._export_daily_to_s3()
            collector.mark_success(total)
        except Exception as exc:
            collector.mark_error(str(exc))
            raise
    else:
        collector.run()


if __name__ == "__main__":
    main()
