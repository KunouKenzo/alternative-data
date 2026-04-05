import os
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

import boto3
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env from project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


class BaseCollector:
    """Base class for all alternative-data collectors."""

    S3_BUCKET = "altdata-exports"

    def __init__(self, source_id: str, name: str | None = None):
        self.source_id = source_id
        self.name = name or self.__class__.__name__
        self.logger = logging.getLogger(self.name)
        self.run_id: str | None = None

        # Supabase
        self.supabase: Client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_ANON_KEY"],
        )

        # S3 / boto3
        self.s3 = boto3.client(
            "s3",
            region_name=os.environ.get("AWS_REGION", "ap-southeast-2"),
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        )

    # ------------------------------------------------------------------
    # Run tracking
    # ------------------------------------------------------------------

    def start_run(self) -> str:
        """Create a collection-run row and return its id."""
        row = {
            "source_id": self.source_id,
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
        }
        result = (
            self.supabase.table("alt_collection_runs").insert(row).execute()
        )
        self.run_id = result.data[0]["id"]
        self.logger.info("Started run %s for source %s", self.run_id, self.source_id)
        return self.run_id

    def mark_success(self, rows_collected: int) -> None:
        """Mark the current run as completed."""
        if not self.run_id:
            return
        self.supabase.table("alt_collection_runs").update(
            {
                "status": "success",
                "rows_collected": rows_collected,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", self.run_id).execute()
        self.logger.info("Run %s succeeded – %d rows collected", self.run_id, rows_collected)

    def mark_error(self, error_message: str) -> None:
        """Mark the current run as failed."""
        if not self.run_id:
            return
        self.supabase.table("alt_collection_runs").update(
            {
                "status": "error",
                "error_message": error_message[:2000],
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", self.run_id).execute()
        self.logger.error("Run %s failed: %s", self.run_id, error_message)

    # ------------------------------------------------------------------
    # Persistence helpers
    # ------------------------------------------------------------------

    def save_to_supabase(self, table_name: str, rows: list[dict]) -> None:
        """Upsert rows into a Supabase table."""
        if not rows:
            self.logger.warning("save_to_supabase called with empty rows list")
            return
        self.supabase.table(table_name).upsert(rows).execute()
        self.logger.info("Upserted %d rows into %s", len(rows), table_name)

    def export_to_s3(self, df: pd.DataFrame, prefix: str) -> str:
        """Upload a DataFrame as CSV to S3 under *prefix*/latest.csv and *prefix*/{date}.csv."""
        csv_bytes = df.to_csv(index=False).encode("utf-8")
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        latest_key = f"{prefix}/latest.csv"
        dated_key = f"{prefix}/{today}.csv"

        for key in (latest_key, dated_key):
            self.s3.put_object(
                Bucket=self.S3_BUCKET,
                Key=key,
                Body=csv_bytes,
                ContentType="text/csv",
            )
            self.logger.info("Uploaded s3://%s/%s", self.S3_BUCKET, key)

        return latest_key

    def update_dataset_metadata(self, dataset_id: str, df: pd.DataFrame) -> None:
        """Update the alt_datasets row with fresh statistics and a preview."""
        # Detect date columns for range
        date_cols = df.select_dtypes(include=["datetime", "datetimetz"]).columns
        date_range_start = None
        date_range_end = None
        if len(date_cols) > 0:
            col = date_cols[0]
            date_range_start = str(df[col].min())
            date_range_end = str(df[col].max())

        preview_data = json.loads(df.head(10).to_json(orient="records", date_format="iso"))

        update = {
            "row_count": len(df),
            "preview_data": preview_data,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }
        if date_range_start:
            update["date_range_start"] = date_range_start
        if date_range_end:
            update["date_range_end"] = date_range_end

        self.supabase.table("alt_datasets").update(update).eq("id", dataset_id).execute()
        self.logger.info("Updated metadata for dataset %s (%d rows)", dataset_id, len(df))

    # ------------------------------------------------------------------
    # Template method – subclasses override this
    # ------------------------------------------------------------------

    def collect(self) -> None:
        """Override in subclasses to perform the actual data collection."""
        raise NotImplementedError

    def run(self) -> None:
        """Entry point: start tracking, collect, finalise."""
        self.start_run()
        try:
            self.collect()
        except Exception as exc:
            self.mark_error(str(exc))
            self.logger.exception("Collection failed")
            raise
