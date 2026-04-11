"""TDL/TDS Wait-Time Collector

Collects real-time attraction wait times from queue-times.com for Tokyo
Disneyland (park_id=274) and Tokyo DisneySea (park_id=275), stores raw
snapshots, and computes daily aggregates used as a proxy for Oriental
Land Company (4661) quarterly attendance.

Usage:
    python collectors/tdl_wait_collector.py
"""

import statistics
import time
from datetime import datetime, timedelta, timezone

import pandas as pd
import requests

from collectors.base import BaseCollector

SOURCE_ID = "c5210a8b-9b60-414a-960c-2b350f19a806"
DATASET_ID = "742fb963-206b-4c0d-af67-2686c97f3d61"

PARKS = {
    "TDL": 274,
    "TDS": 275,
}

# Weight map for "crowd score" — mirrors exapmle/tdl.md top rides table.
# For TDS the TDL-specific names will simply not match and the score
# falls back to the overall wait_avg ratio.
TOP_RIDES_TDL = {
    "Space Mountain": 0.25,
    "Splash Mountain": 0.22,
    "Big Thunder Mountain": 0.20,
    "Pooh's Hunny Hunt": 0.18,
    "Haunted Mansion": 0.15,
}
TOP_RIDES_TDS = {
    "Soaring: Fantastic Flight": 0.25,
    "Tower of Terror": 0.22,
    "Journey to the Center of the Earth": 0.20,
    "Toy Story Mania!": 0.18,
    "Indiana Jones Adventure: Temple of the Crystal Skull": 0.15,
}
TOP_RIDES = {274: TOP_RIDES_TDL, 275: TOP_RIDES_TDS}

# Normalising denominator for crowd_score. Heuristic ceiling of 180 min
# keeps the score in roughly [0, 1] without needing a 90-day lookback.
CROWD_SCORE_CEILING_MIN = 180.0

TABLE_RAW = "tdl_wait_raw"
TABLE_DAILY = "tdl_wait_daily"

# JST park hours ~ 08:00-22:00 → 23:00-13:00 UTC.
PARK_OPEN_UTC_HOUR = 23  # wraps across midnight
PARK_CLOSE_UTC_HOUR = 13

USER_AGENT = (
    "data-platform:tdl-wait-collector:v1.0 "
    "(https://github.com/KunouKenzo/alternative-data)"
)
REQUEST_DELAY_SEC = 2


class TdlWaitCollector(BaseCollector):

    def __init__(self):
        super().__init__(source_id=SOURCE_ID, name="TdlWait")
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})

    # ------------------------------------------------------------------
    # HTTP
    # ------------------------------------------------------------------

    def _request_with_retry(
        self, url: str, max_retries: int = 3
    ) -> requests.Response | None:
        """GET with exponential backoff for 429/5xx (mirrors reddit collector)."""
        delays = [5, 10, 20]
        for attempt in range(max_retries):
            try:
                resp = self.session.get(url, timeout=30)
                if resp.status_code == 200:
                    return resp
                if resp.status_code in (429, 503) and attempt < max_retries - 1:
                    self.logger.warning(
                        "HTTP %d from %s, retrying in %ds",
                        resp.status_code, url, delays[attempt],
                    )
                    time.sleep(delays[attempt])
                    continue
                resp.raise_for_status()
            except requests.RequestException as exc:
                if attempt < max_retries - 1:
                    self.logger.warning(
                        "Request error: %s, retrying in %ds", exc, delays[attempt]
                    )
                    time.sleep(delays[attempt])
                else:
                    raise
        return None

    # ------------------------------------------------------------------
    # Fetch
    # ------------------------------------------------------------------

    def _fetch_park(self, park_id: int) -> list[dict]:
        """Fetch one park's current queue_times.json and flatten to rows."""
        url = f"https://queue-times.com/parks/{park_id}/queue_times.json"
        collected_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

        resp = self._request_with_retry(url)
        if resp is None:
            self.logger.error("Failed to fetch park %d", park_id)
            return []

        payload = resp.json()

        # queue-times.com returns rides either grouped by `lands[]` (most
        # western parks) or as a flat `rides[]` (Tokyo Disneyland/DisneySea).
        rides_iter: list[dict] = []
        for land in payload.get("lands") or []:
            rides_iter.extend(land.get("rides") or [])
        rides_iter.extend(payload.get("rides") or [])

        rows: list[dict] = []
        seen_ids: set[int] = set()
        for ride in rides_iter:
            rid = int(ride.get("id", 0))
            if rid in seen_ids:
                continue
            seen_ids.add(rid)
            is_open = bool(ride.get("is_open", False))
            wait_time = ride.get("wait_time")
            rows.append({
                "collected_at": collected_at,
                "park_id": park_id,
                "ride_id": rid,
                "ride_name": (ride.get("name") or "")[:200],
                "is_open": is_open,
                "wait_min": int(wait_time) if is_open and wait_time is not None else None,
                "last_updated": ride.get("last_updated"),
            })

        self.logger.info("Fetched %d rides from park %d", len(rows), park_id)
        return rows

    # ------------------------------------------------------------------
    # Persist
    # ------------------------------------------------------------------

    def _upsert_raw(self, rows: list[dict]) -> None:
        if not rows:
            return
        batch_size = 500
        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]
            self.supabase.table(TABLE_RAW).upsert(
                batch, on_conflict="collected_at,park_id,ride_id"
            ).execute()
        self.logger.info("Upserted %d raw snapshots", len(rows))

    # ------------------------------------------------------------------
    # Aggregation
    # ------------------------------------------------------------------

    @staticmethod
    def _utc_to_jst_date(ts_iso: str) -> str:
        """Return the JST calendar date (YYYY-MM-DD) for a UTC timestamp."""
        dt = datetime.fromisoformat(ts_iso.replace("Z", "+00:00"))
        return (dt + timedelta(hours=9)).strftime("%Y-%m-%d")

    @staticmethod
    def _is_park_hour(ts_iso: str) -> bool:
        """Filter raw rows to roughly 8:00-22:00 JST (= 23-13 UTC)."""
        dt = datetime.fromisoformat(ts_iso.replace("Z", "+00:00"))
        hour = dt.hour
        # Window wraps across midnight UTC.
        return hour >= PARK_OPEN_UTC_HOUR or hour <= PARK_CLOSE_UTC_HOUR

    def _aggregate_daily(self) -> None:
        """Recompute tdl_wait_daily for today and yesterday (JST)."""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        resp = (
            self.supabase.table(TABLE_RAW)
            .select("collected_at,park_id,ride_name,is_open,wait_min")
            .gte("collected_at", cutoff)
            .limit(50000)
            .execute()
        )
        if not resp.data:
            self.logger.info("No raw rows in the 2-day window; skipping aggregation")
            return

        # Bucket by (date_jst, park_id)
        buckets: dict[tuple[str, int], list[dict]] = {}
        for row in resp.data:
            if not self._is_park_hour(row["collected_at"]):
                continue
            key = (self._utc_to_jst_date(row["collected_at"]), row["park_id"])
            buckets.setdefault(key, []).append(row)

        daily_rows = []
        for (date_str, park_id), records in buckets.items():
            open_records = [r for r in records if r["is_open"] and r["wait_min"] is not None]
            if not open_records:
                continue

            waits = [r["wait_min"] for r in open_records]
            wait_avg = round(sum(waits) / len(waits), 2)
            wait_med = round(statistics.median(waits), 2)
            wait_max = max(waits)
            open_ratio = round(len(open_records) / len(records), 4)

            # crowd_score — weighted avg wait of the park's top rides.
            weights = TOP_RIDES.get(park_id, {})
            per_ride_waits: dict[str, list[int]] = {}
            for r in open_records:
                if r["ride_name"] in weights:
                    per_ride_waits.setdefault(r["ride_name"], []).append(r["wait_min"])

            weighted_sum = 0.0
            weight_total = 0.0
            for name, w in weights.items():
                if name in per_ride_waits:
                    avg = sum(per_ride_waits[name]) / len(per_ride_waits[name])
                    weighted_sum += avg * w
                    weight_total += w
            if weight_total > 0:
                crowd_score = round(
                    min((weighted_sum / weight_total) / CROWD_SCORE_CEILING_MIN, 1.0),
                    4,
                )
            else:
                # Fallback: use overall average normalised by ceiling.
                crowd_score = round(min(wait_avg / CROWD_SCORE_CEILING_MIN, 1.0), 4)

            daily_rows.append({
                "date": date_str,
                "park_id": park_id,
                "wait_avg": wait_avg,
                "wait_med": wait_med,
                "wait_max": wait_max,
                "crowd_score": crowd_score,
                "open_ratio": open_ratio,
                "sample_count": len(open_records),
            })

        if daily_rows:
            self.supabase.table(TABLE_DAILY).upsert(
                daily_rows, on_conflict="date,park_id"
            ).execute()
            self.logger.info("Upserted %d daily aggregate rows", len(daily_rows))

    # ------------------------------------------------------------------
    # S3 export
    # ------------------------------------------------------------------

    def _export_to_s3(self) -> None:
        resp = (
            self.supabase.table(TABLE_DAILY)
            .select("*")
            .order("date", desc=True)
            .limit(365 * 2)
            .execute()
        )
        if resp.data:
            df = pd.DataFrame(resp.data)
            self.export_to_s3(df, "tdl-queue-times")
            self.update_dataset_metadata(DATASET_ID, df)

    # ------------------------------------------------------------------
    # Main
    # ------------------------------------------------------------------

    def collect(self) -> None:
        total_rows = 0
        for i, (park_name, park_id) in enumerate(PARKS.items()):
            self.logger.info("Fetching %s (park_id=%d)", park_name, park_id)
            rows = self._fetch_park(park_id)
            if rows:
                self._upsert_raw(rows)
                total_rows += len(rows)
            if i < len(PARKS) - 1:
                time.sleep(REQUEST_DELAY_SEC)

        self._aggregate_daily()
        self._export_to_s3()
        self.mark_success(total_rows)


if __name__ == "__main__":
    collector = TdlWaitCollector()
    collector.run()
