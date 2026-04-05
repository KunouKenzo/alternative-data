"""Backfill script for Steel Plant Activity Index.

Fetches Sentinel-2 SWIR data from 2017-03 to present, month by month.
Idempotent: safe to re-run (uses upsert on facility_id + image_date).

Usage:
    python -m collectors.steel_plant_backfill
    python -m collectors.steel_plant_backfill --start 2020-01-01 --end 2020-12-31
"""

import argparse
import logging
from datetime import datetime, timezone

from collectors.steel_plant_collector import SteelPlantCollector
from collectors.steel_plant_config import FACILITIES

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("steel_pipeline.log"),
    ],
)
logger = logging.getLogger("steel_backfill")

BACKFILL_START = "2017-03-01"


def main():
    parser = argparse.ArgumentParser(description="Steel Plant Activity Backfill")
    parser.add_argument(
        "--start", default=BACKFILL_START,
        help=f"Start date (default: {BACKFILL_START})",
    )
    parser.add_argument(
        "--end",
        default=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        help="End date (default: today)",
    )
    args = parser.parse_args()

    logger.info("=== Steel Plant Backfill ===")
    logger.info("Range: %s to %s", args.start, args.end)
    logger.info("Facilities: %s", list(FACILITIES.keys()))

    collector = SteelPlantCollector()
    collector._init_gee()
    collector.start_run()

    try:
        total = collector.collect_range(args.start, args.end)
        logger.info("Daily data complete: %d total rows", total)

        # Recompute all monthly aggregates
        for fid in FACILITIES:
            collector._aggregate_monthly(fid)
        logger.info("Monthly aggregation complete")

        # Full S3 export
        collector._export_daily_to_s3()
        logger.info("S3 export complete")

        collector.mark_success(total)
        logger.info("=== Backfill finished successfully ===")

    except Exception as exc:
        collector.mark_error(str(exc))
        logger.exception("Backfill failed")
        raise


if __name__ == "__main__":
    main()
