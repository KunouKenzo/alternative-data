"""TDR Weather Collector (Maihama)

Fetches daily weather data for the Tokyo Disney Resort area from the
Open-Meteo free API, which is free for commercial use and requires no
API key. Data is used as auxiliary features for the TDL/TDS attendance
prediction pipeline (rain reduces average wait time ~23% per
exapmle/tdl.md).

Usage:
    # Incremental (last 7 days rolling window):
    python collectors/tdl_weather_collector.py

    # Backfill a year of history:
    python collectors/tdl_weather_collector.py --backfill-days 365
"""

import argparse
import time
from datetime import date, datetime, timedelta, timezone

import pandas as pd
import requests

from collectors.base import BaseCollector

SOURCE_ID = "e77c33fa-fd88-49d4-b725-9afb423d83c7"
DATASET_ID = "7814dd54-b975-4bb4-8eb3-84b88267e6b0"

# Maihama observation point (Tokyo Disney Resort).
LAT = 35.634
LON = 139.883
TZ = "Asia/Tokyo"

TABLE_DAILY = "tdl_weather_daily"

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
DAILY_VARS = [
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "sunshine_duration",
    "wind_speed_10m_max",
]

USER_AGENT = "data-platform:tdl-weather-collector:v1.0"


class TdlWeatherCollector(BaseCollector):

    def __init__(self, backfill_days: int = 0):
        super().__init__(source_id=SOURCE_ID, name="TdlWeather")
        self.backfill_days = backfill_days
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})

    # ------------------------------------------------------------------
    # HTTP
    # ------------------------------------------------------------------

    def _request_with_retry(
        self, url: str, params: dict, max_retries: int = 3
    ) -> requests.Response | None:
        delays = [5, 10, 20]
        for attempt in range(max_retries):
            try:
                resp = self.session.get(url, params=params, timeout=30)
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

    def _fetch_forecast(self, past_days: int = 7) -> list[dict]:
        """Rolling window via the forecast endpoint (fast, low latency)."""
        params = {
            "latitude": LAT,
            "longitude": LON,
            "daily": ",".join(DAILY_VARS),
            "past_days": past_days,
            "forecast_days": 1,
            "timezone": TZ,
        }
        resp = self._request_with_retry(FORECAST_URL, params)
        return self._parse_daily(resp.json()) if resp else []

    def _fetch_archive(self, start: date, end: date) -> list[dict]:
        """Use the archive endpoint for historical backfills."""
        params = {
            "latitude": LAT,
            "longitude": LON,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "daily": ",".join(DAILY_VARS),
            "timezone": TZ,
        }
        resp = self._request_with_retry(ARCHIVE_URL, params)
        return self._parse_daily(resp.json()) if resp else []

    @staticmethod
    def _parse_daily(payload: dict) -> list[dict]:
        daily = payload.get("daily") or {}
        dates = daily.get("time") or []
        t_max = daily.get("temperature_2m_max") or []
        t_min = daily.get("temperature_2m_min") or []
        precip = daily.get("precipitation_sum") or []
        sunshine_sec = daily.get("sunshine_duration") or []
        wind_kmh = daily.get("wind_speed_10m_max") or []

        rows = []
        for i, d in enumerate(dates):
            p = precip[i] if i < len(precip) else None
            s = sunshine_sec[i] if i < len(sunshine_sec) else None
            rows.append({
                "date": d,
                "temp_max": t_max[i] if i < len(t_max) else None,
                "temp_min": t_min[i] if i < len(t_min) else None,
                "precipitation_mm": p,
                "sunshine_hours": round(s / 3600.0, 2) if s is not None else None,
                "is_rain": bool(p is not None and p >= 1.0),
                "wind_max_kmh": wind_kmh[i] if i < len(wind_kmh) else None,
            })
        return rows

    # ------------------------------------------------------------------
    # Persist
    # ------------------------------------------------------------------

    def _upsert_daily(self, rows: list[dict]) -> None:
        if not rows:
            return
        batch_size = 500
        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]
            self.supabase.table(TABLE_DAILY).upsert(
                batch, on_conflict="date"
            ).execute()
        self.logger.info("Upserted %d weather rows", len(rows))

    # ------------------------------------------------------------------
    # S3 export
    # ------------------------------------------------------------------

    def _export_to_s3(self) -> None:
        resp = (
            self.supabase.table(TABLE_DAILY)
            .select("*")
            .order("date", desc=True)
            .limit(365 * 3)
            .execute()
        )
        if resp.data:
            df = pd.DataFrame(resp.data)
            self.export_to_s3(df, "tdl-weather-maihama")
            self.update_dataset_metadata(DATASET_ID, df)

    # ------------------------------------------------------------------
    # Main
    # ------------------------------------------------------------------

    def collect(self) -> None:
        total = 0
        if self.backfill_days and self.backfill_days > 0:
            end = date.today()
            start = end - timedelta(days=self.backfill_days)
            self.logger.info("Backfilling weather %s → %s", start, end)
            rows = self._fetch_archive(start, end)
            self._upsert_daily(rows)
            total += len(rows)
        else:
            rows = self._fetch_forecast(past_days=7)
            self._upsert_daily(rows)
            total += len(rows)

        self._export_to_s3()
        self.mark_success(total)


def _parse_args():
    parser = argparse.ArgumentParser(description="TDR weather collector")
    parser.add_argument(
        "--backfill-days",
        type=int,
        default=0,
        help="If >0, backfill this many days of history via the archive API "
             "instead of fetching the rolling 7-day window.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    collector = TdlWeatherCollector(backfill_days=args.backfill_days)
    collector.run()
