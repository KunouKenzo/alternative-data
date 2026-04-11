"""S&P500 Sector Rotation Collector.

Pulls free, public sources (Yahoo Finance + CFTC COT) and computes a four-signal
rotation composite score for the 11 SPDR Select Sector ETFs.

Usage:
    python3 -m collectors.sector_rotation_collector            # incremental
    BACKFILL=1 python3 -m collectors.sector_rotation_collector # full 2024-01-01 onward
"""

from __future__ import annotations

import os
import time
from datetime import date, datetime, timezone
from typing import Iterable

import numpy as np
import pandas as pd
import yfinance as yf

from collectors.base import BaseCollector
from collectors.sector_rotation_analysis import (
    ALL_TICKERS,
    BENCHMARK,
    COMPOSITE_WEIGHTS,
    SECTOR_TICKERS,
    accumulation_distribution_volume,
    compute_composite,
    compute_flow_momentum,
    compute_rs_ratio,
    compute_rs_signal,
    compute_rs_momentum,
    cross_sectional_pc_score,
    directional_pressure_normalized,
    normalize_rs_momentum,
    risk_appetite_score,
    sector_macro_alignment,
)

SOURCE_ID = "d7f6a9b2-1c4e-4a85-9f2e-5e8b3d7c1a40"
DATASET_ROTATION = "e8a7b3c4-2d5f-4b96-a0f3-6f9c4e8d2b51"
DATASET_FLOW = "f9b8c4d5-3e60-4ca7-b104-7ad5f9e3c362"
DATASET_OPTIONS = "a0c9d5e6-4f71-4db8-c215-8be60a4d4473"
DATASET_COT = "b1dae6f7-5082-4ec9-d326-9cf71b5e5584"
DATASET_COMPOSITE = "c2ebf708-6193-4fda-e437-ad082c6f6695"

TABLE_ETF = "sector_etf_daily"
TABLE_OPTIONS = "sector_options_daily"
TABLE_COT = "cot_positioning_weekly"
TABLE_MACRO = "macro_indicators_daily"
TABLE_ROTATION = "sector_rotation_daily"

COT_CONTRACTS = {
    "E-MINI S&P 500": "E-MINI S&P 500 - CHICAGO MERCANTILE EXCHANGE",
    "NASDAQ MINI": "NASDAQ MINI - CHICAGO MERCANTILE EXCHANGE",
}

MACRO_TICKERS = {
    "VIX": "^VIX",
    "TNX": "^TNX",
    "IRX": "^IRX",
    "CL": "CL=F",
    "HG": "HG=F",
    "GC": "GC=F",
    "DXY": "DX-Y.NYB",
    "USDJPY": "JPY=X",
}

DEFAULT_BACKFILL_START = "2024-01-01"


class SectorRotationCollector(BaseCollector):

    def __init__(self):
        super().__init__(source_id=SOURCE_ID, name="SectorRotation")

    # ------------------------------------------------------------------
    # Fetching
    # ------------------------------------------------------------------

    def _fetch_prices(self, start: str, end: str) -> dict[str, pd.DataFrame]:
        self.logger.info("Downloading prices for %d tickers", len(ALL_TICKERS))
        data = yf.download(
            tickers=ALL_TICKERS,
            start=start,
            end=end,
            auto_adjust=False,
            group_by="ticker",
            progress=False,
            threads=True,
        )
        out: dict[str, pd.DataFrame] = {}
        for t in ALL_TICKERS:
            if t in data.columns.get_level_values(0):
                sub = data[t].dropna(how="all").copy()
                sub.index = pd.to_datetime(sub.index)
                out[t] = sub
        self.logger.info("Fetched OHLCV for %d tickers", len(out))
        return out

    def _fetch_macro(self, start: str, end: str) -> pd.DataFrame:
        self.logger.info("Downloading macro tickers")
        data = yf.download(
            tickers=list(MACRO_TICKERS.values()),
            start=start,
            end=end,
            auto_adjust=False,
            group_by="ticker",
            progress=False,
            threads=True,
        )
        frame = {}
        for name, ticker in MACRO_TICKERS.items():
            if ticker in data.columns.get_level_values(0):
                series = data[ticker]["Close"].dropna()
                frame[name] = series
        df = pd.DataFrame(frame)
        df.index = pd.to_datetime(df.index)
        self.logger.info("Macro frame: %d rows × %d cols", *df.shape)
        return df

    def _fetch_options_snapshot(self) -> pd.DataFrame:
        """Snapshot put/call volume and OI for each sector ETF (current expirations only)."""
        today = date.today().isoformat()
        rows = []
        for ticker in SECTOR_TICKERS:
            try:
                t = yf.Ticker(ticker)
                expirations = t.options or []
            except Exception as exc:
                self.logger.warning("Options list failed for %s: %s", ticker, exc)
                continue

            # Only first 6 expirations to limit network pressure.
            call_vol = put_vol = call_oi = put_oi = 0
            for exp in expirations[:6]:
                try:
                    chain = t.option_chain(exp)
                except Exception as exc:
                    self.logger.warning("Chain fetch failed %s %s: %s", ticker, exp, exc)
                    continue
                call_vol += int(chain.calls["volume"].fillna(0).sum())
                put_vol += int(chain.puts["volume"].fillna(0).sum())
                call_oi += int(chain.calls["openInterest"].fillna(0).sum())
                put_oi += int(chain.puts["openInterest"].fillna(0).sum())
                time.sleep(0.3)

            pc_ratio = (put_vol / call_vol) if call_vol > 0 else None
            rows.append(
                {
                    "ticker": ticker,
                    "date": today,
                    "call_volume": call_vol,
                    "put_volume": put_vol,
                    "call_oi": call_oi,
                    "put_oi": put_oi,
                    "put_call_ratio": pc_ratio,
                    "pc_zscore": None,
                    "sector_rank": None,
                }
            )

        df = pd.DataFrame(rows)
        if not df.empty:
            df["sector_rank"] = (
                df["put_call_ratio"].rank(ascending=True, method="min").astype("Int64")
            )
        self.logger.info("Options snapshot: %d rows", len(df))
        return df

    def _fetch_cot(self, years: Iterable[int]) -> pd.DataFrame:
        import cot_reports as cot

        frames = []
        for year in years:
            try:
                df = cot.cot_year(
                    year, cot_report_type="traders_in_financial_futures_fut"
                )
                frames.append(df)
            except Exception as exc:
                self.logger.warning("COT fetch failed for %d: %s", year, exc)
        if not frames:
            return pd.DataFrame()

        raw = pd.concat(frames, ignore_index=True)
        raw = raw[raw["Market_and_Exchange_Names"].isin(COT_CONTRACTS.values())].copy()
        raw["report_date"] = pd.to_datetime(raw["Report_Date_as_YYYY-MM-DD"]).dt.date

        def net(col_long, col_short):
            return raw[col_long].astype(float) - raw[col_short].astype(float)

        raw["asset_mgr_long"] = raw["Asset_Mgr_Positions_Long_All"].astype(float)
        raw["asset_mgr_short"] = raw["Asset_Mgr_Positions_Short_All"].astype(float)
        raw["asset_mgr_net"] = net(
            "Asset_Mgr_Positions_Long_All", "Asset_Mgr_Positions_Short_All"
        )
        raw["leveraged_long"] = raw["Lev_Money_Positions_Long_All"].astype(float)
        raw["leveraged_short"] = raw["Lev_Money_Positions_Short_All"].astype(float)
        raw["leveraged_net"] = net(
            "Lev_Money_Positions_Long_All", "Lev_Money_Positions_Short_All"
        )
        raw["total_oi"] = raw["Open_Interest_All"].astype(float)
        short_names = {v: k for k, v in COT_CONTRACTS.items()}
        raw["contract"] = raw["Market_and_Exchange_Names"].map(short_names)

        cols = [
            "report_date",
            "contract",
            "asset_mgr_long",
            "asset_mgr_short",
            "asset_mgr_net",
            "leveraged_long",
            "leveraged_short",
            "leveraged_net",
            "total_oi",
        ]
        out = raw[cols].drop_duplicates(["report_date", "contract"]).copy()

        # 52-week percentile for asset_mgr_net per contract.
        out = out.sort_values(["contract", "report_date"])
        out["percentile_52w"] = out.groupby("contract")["asset_mgr_net"].transform(
            lambda s: s.rolling(52, min_periods=8).apply(
                lambda x: (x.rank(pct=True).iloc[-1]) * 100, raw=False
            )
        )
        self.logger.info("COT rows: %d", len(out))
        return out

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def _upsert(self, table: str, rows: list[dict], on_conflict: str, chunk: int = 500):
        if not rows:
            return
        for i in range(0, len(rows), chunk):
            batch = rows[i : i + chunk]
            self.supabase.table(table).upsert(batch, on_conflict=on_conflict).execute()
        self.logger.info("Upserted %d rows into %s", len(rows), table)

    def _persist_etf_daily(self, prices: dict[str, pd.DataFrame]) -> pd.DataFrame:
        rows = []
        # Current shares outstanding snapshot (not historical) to compute approximate AUM.
        shares_snapshot = {}
        for t in ALL_TICKERS:
            try:
                info = yf.Ticker(t).info
                shares_snapshot[t] = info.get("sharesOutstanding") or 0
            except Exception:
                shares_snapshot[t] = 0

        frames = []
        for ticker, df in prices.items():
            if df.empty:
                continue
            sub = df.reset_index().rename(columns={"Date": "date"})
            sub["ticker"] = ticker
            sub["shares_outstanding"] = shares_snapshot.get(ticker, 0)
            sub["close"] = sub["Close"].astype(float)
            sub["volume"] = sub["Volume"].fillna(0).astype("int64")
            sub["aum_usd"] = sub["close"] * sub["shares_outstanding"]
            # Money pressure proxy (Accumulation/Distribution volume × close).
            mfv = accumulation_distribution_volume(df)
            sub["est_flow_usd"] = (mfv * sub["close"].values).values
            sub["date"] = pd.to_datetime(sub["date"]).dt.date.astype(str)
            frames.append(
                sub[
                    [
                        "ticker",
                        "date",
                        "close",
                        "volume",
                        "shares_outstanding",
                        "aum_usd",
                        "est_flow_usd",
                    ]
                ]
            )

        if not frames:
            return pd.DataFrame()
        full = pd.concat(frames, ignore_index=True)
        rows = full.to_dict("records")
        self._upsert(TABLE_ETF, rows, on_conflict="ticker,date")
        return full

    def _persist_options(self, df: pd.DataFrame) -> None:
        if df.empty:
            return
        rows = df.where(pd.notnull(df), None).to_dict("records")
        self._upsert(TABLE_OPTIONS, rows, on_conflict="ticker,date")

    def _persist_cot(self, df: pd.DataFrame) -> None:
        if df.empty:
            return
        out = df.copy()
        out["report_date"] = out["report_date"].astype(str)
        # numpy types → Python floats / ints for json serialisation
        for col in [
            "asset_mgr_long",
            "asset_mgr_short",
            "asset_mgr_net",
            "leveraged_long",
            "leveraged_short",
            "leveraged_net",
            "total_oi",
        ]:
            out[col] = out[col].astype("Int64")
        out = out.where(pd.notnull(out), None)
        rows = out.to_dict("records")
        # Int64 with NA becomes pd.NA — coerce
        for r in rows:
            for k, v in list(r.items()):
                if pd.isna(v):
                    r[k] = None
                elif hasattr(v, "item"):
                    r[k] = v.item()
        self._upsert(TABLE_COT, rows, on_conflict="report_date,contract")

    def _persist_macro(self, df: pd.DataFrame) -> None:
        if df.empty:
            return
        stacked = df.stack().reset_index()
        stacked.columns = ["date", "indicator", "value"]
        stacked["date"] = pd.to_datetime(stacked["date"]).dt.date.astype(str)
        stacked = stacked.dropna(subset=["value"])
        rows = stacked.to_dict("records")
        self._upsert(TABLE_MACRO, rows, on_conflict="date,indicator")

    def _persist_rotation(self, composite_today: pd.DataFrame, today: str) -> None:
        if composite_today.empty:
            return
        rows = []
        for ticker, row in composite_today.iterrows():
            rows.append(
                {
                    "date": today,
                    "ticker": ticker,
                    "sector_name": SECTOR_TICKERS.get(ticker, ticker),
                    "rs_ratio": None,
                    "rs_signal": row.get("rs_signal"),
                    "rs_momentum": float(row["rs_momentum"]),
                    "flow_momentum": float(row["flow_momentum"]),
                    "options_sentiment": float(row["options_sentiment"]),
                    "macro_alignment": float(row["macro_alignment"]),
                    "composite_score": float(row["composite_score"]),
                    "rotation_rank": int(row["rotation_rank"]),
                    "signal_confluence": int(row["signal_confluence"]),
                }
            )
        self._upsert(TABLE_ROTATION, rows, on_conflict="date,ticker")

    # ------------------------------------------------------------------
    # Main
    # ------------------------------------------------------------------

    def collect(self) -> None:
        end = (date.today()).isoformat()
        backfill = os.environ.get("BACKFILL") == "1"
        start = DEFAULT_BACKFILL_START if backfill else (
            (date.today() - pd.Timedelta(days=400)).isoformat()
        )

        prices = self._fetch_prices(start, end)
        etf_df = self._persist_etf_daily(prices)

        macro_df = self._fetch_macro(start, end)
        self._persist_macro(macro_df)

        options_df = self._fetch_options_snapshot()
        self._persist_options(options_df)

        years_to_fetch = sorted({date.today().year, date.today().year - 1, date.today().year - 2})
        cot_df = self._fetch_cot(years_to_fetch)
        self._persist_cot(cot_df)

        # -------- Compute composite score --------
        close_frame = pd.DataFrame(
            {t: prices[t]["Close"] for t in ALL_TICKERS if t in prices}
        ).sort_index()

        rs_ratio = compute_rs_ratio(close_frame)
        rs_signal = compute_rs_signal(rs_ratio)
        rs_mom_pct = compute_rs_momentum(rs_ratio)
        rs_mom = normalize_rs_momentum(rs_mom_pct)

        mfv_by_ticker = {
            t: accumulation_distribution_volume(prices[t])
            for t in SECTOR_TICKERS
            if t in prices
        }
        flow_z = directional_pressure_normalized(mfv_by_ticker)
        flow_mom = flow_z.iloc[-1] if not flow_z.empty else pd.Series(dtype=float)

        options_sent = pd.Series(dtype=float)
        if not options_df.empty:
            pc = options_df.set_index("ticker")["put_call_ratio"]
            options_sent = cross_sectional_pc_score(pc.dropna())

        appetite = risk_appetite_score(macro_df)
        latest_appetite = float(appetite.dropna().iloc[-1]) if not appetite.empty else 0.0
        macro_align = pd.Series(
            {t: sector_macro_alignment(t, latest_appetite) for t in SECTOR_TICKERS}
        )

        composite = compute_composite(rs_mom, flow_mom, options_sent, macro_align)
        composite["rs_signal"] = rs_signal.iloc[-1] if not rs_signal.empty else None

        self._persist_rotation(composite, today=end)

        # -------- Total rows across all tables for run tracking --------
        total = (
            (len(etf_df) if etf_df is not None else 0)
            + len(options_df)
            + len(cot_df)
            + len(composite)
        )

        # -------- Export to S3 --------
        self._export_all(etf_df, options_df, cot_df, macro_df, composite, end)

        self.mark_success(total)

    def _export_all(
        self,
        etf_df: pd.DataFrame,
        options_df: pd.DataFrame,
        cot_df: pd.DataFrame,
        macro_df: pd.DataFrame,
        composite: pd.DataFrame,
        run_date: str,
    ) -> None:
        """Best-effort S3 export — swallow errors if AWS creds are absent."""
        try:
            if etf_df is not None and not etf_df.empty:
                self.export_to_s3(etf_df, "sector-rotation/etf-daily")
                self.update_dataset_metadata(DATASET_FLOW, etf_df)
            if not options_df.empty:
                self.export_to_s3(options_df, "sector-rotation/options-daily")
                self.update_dataset_metadata(DATASET_OPTIONS, options_df)
            if not cot_df.empty:
                self.export_to_s3(cot_df, "sector-rotation/cot-weekly")
                self.update_dataset_metadata(DATASET_COT, cot_df)
            if not composite.empty:
                composite_out = composite.reset_index().rename(columns={"index": "ticker"})
                composite_out["date"] = run_date
                self.export_to_s3(composite_out, "sector-rotation/composite-daily")
                self.update_dataset_metadata(DATASET_COMPOSITE, composite_out)
                self.update_dataset_metadata(DATASET_ROTATION, composite_out)
        except Exception as exc:
            self.logger.warning("S3 export skipped: %s", exc)


if __name__ == "__main__":
    SectorRotationCollector().run()
