"""Backfill only the newly added 6 facilities (skip existing kimitsu/kashima)."""

import logging
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

sys.path.insert(0, str(PROJECT_ROOT))

from collectors.steel_plant_collector import SteelPlantCollector
from collectors.steel_plant_config import FACILITIES

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("backfill_new")

NEW_FACILITY_IDS = [
    "nippon_steel_muroran",
    "nippon_steel_nagoya",
    "nippon_steel_wakayama",
    "nippon_steel_oita",
    "nippon_steel_yawata",
    "nippon_steel_hirohata",
]

BACKFILL_START = "2017-03-01"


def main():
    end_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    logger.info("=== Backfill new facilities: %s to %s ===", BACKFILL_START, end_date)

    collector = SteelPlantCollector()
    collector._init_gee()

    from dateutil.relativedelta import relativedelta
    from datetime import timedelta

    start = datetime.strptime(BACKFILL_START, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")

    total_rows = 0

    for fid in NEW_FACILITY_IDS:
        if fid not in FACILITIES:
            logger.error("Facility %s not found in config", fid)
            continue

        fac = FACILITIES[fid]
        logger.info("--- Processing %s (%s) ---", fid, fac["name"])

        current = start.replace(day=1)
        facility_rows = 0

        while current <= end:
            month_end = current + relativedelta(months=1) - timedelta(days=1)
            if month_end > end:
                month_end = end

            chunk_start = max(current, start).strftime("%Y-%m-%d")
            chunk_end = (min(month_end, end) + timedelta(days=1)).strftime("%Y-%m-%d")

            for attempt in range(1, 4):
                try:
                    rows = collector._fetch_observations(fid, fac, chunk_start, chunk_end)
                    if rows:
                        collector._upsert_daily(rows)
                        facility_rows += len(rows)
                        total_rows += len(rows)
                    break
                except Exception as exc:
                    wait = 5 * (2 ** (attempt - 1))
                    logger.warning(
                        "Attempt %d/3 failed for %s %s: %s. Retrying in %ds...",
                        attempt, fid, chunk_start, exc, wait,
                    )
                    if attempt == 3:
                        logger.error("Giving up on %s for %s", fid, chunk_start)
                    else:
                        time.sleep(wait)

            current += relativedelta(months=1)
            time.sleep(2)

        # Monthly aggregation for this facility
        collector._aggregate_monthly(fid)
        logger.info("Completed %s: %d rows", fid, facility_rows)

    logger.info("=== Backfill complete: %d total rows ===", total_rows)


if __name__ == "__main__":
    main()
