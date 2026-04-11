"""Pure analysis helpers for the sector rotation pipeline.

All functions take pandas DataFrames and return pandas objects.
No I/O, no supabase / yfinance calls — keep this module easy to unit test.
"""

from __future__ import annotations

import numpy as np
import pandas as pd


SECTOR_TICKERS = {
    "XLK": "Technology",
    "XLV": "Health Care",
    "XLF": "Financials",
    "XLY": "Consumer Discretionary",
    "XLP": "Consumer Staples",
    "XLE": "Energy",
    "XLI": "Industrials",
    "XLB": "Materials",
    "XLU": "Utilities",
    "XLRE": "Real Estate",
    "XLC": "Communication Services",
}
BENCHMARK = "SPY"
ALL_TICKERS = list(SECTOR_TICKERS) + [BENCHMARK]


# ---------------------------------------------------------------------------
# Relative Strength
# ---------------------------------------------------------------------------

def compute_rs_ratio(prices: pd.DataFrame, benchmark: str = BENCHMARK) -> pd.DataFrame:
    """Return a DataFrame of sector_close / benchmark_close, indexed by date."""
    bench = prices[benchmark]
    rs = prices.div(bench, axis=0)
    rs = rs.drop(columns=[benchmark], errors="ignore")
    return rs


def compute_rs_signal(rs_ratio: pd.DataFrame, span: int = 21) -> pd.DataFrame:
    """Return Outperform/Underperform signal vs span-day EMA of the RS ratio."""
    ema = rs_ratio.ewm(span=span, adjust=False).mean()
    diff = rs_ratio - ema
    signal = diff.map(lambda x: "Outperform" if x > 0 else "Underperform")
    return signal


def compute_rs_momentum(rs_ratio: pd.DataFrame, window: int = 63) -> pd.Series:
    """Return 3-month (~63 business day) percentage change of RS ratio."""
    latest = rs_ratio.iloc[-1]
    past = rs_ratio.iloc[-window] if len(rs_ratio) > window else rs_ratio.iloc[0]
    return (latest / past - 1.0) * 100.0


# ---------------------------------------------------------------------------
# Money pressure (flow proxy) — Accumulation / Distribution based
# ---------------------------------------------------------------------------

def accumulation_distribution_volume(ohlcv: pd.DataFrame) -> pd.Series:
    """Chaikin Money Flow Volume for a single ticker OHLCV frame.

    MF Multiplier = ((Close - Low) - (High - Close)) / (High - Low)
    MF Volume     = Multiplier × Volume
    Returns a Series indexed like the input.
    """
    high = ohlcv["High"]
    low = ohlcv["Low"]
    close = ohlcv["Close"]
    volume = ohlcv["Volume"]

    span = (high - low).replace(0, np.nan)
    mult = ((close - low) - (high - close)) / span
    mult = mult.fillna(0.0)
    return mult * volume


def compute_flow_momentum(mf_volume: pd.Series, window: int = 20) -> pd.Series:
    """20-day rolling sum of MF Volume normalised by 20-day total volume."""
    return mf_volume.rolling(window).sum()


def directional_pressure_normalized(
    mfv_by_ticker: dict[str, pd.Series], window: int = 20
) -> pd.DataFrame:
    """Stack per-ticker flow momentum and normalise cross-sectionally per day."""
    frame = pd.DataFrame(
        {t: s.rolling(window).sum() for t, s in mfv_by_ticker.items()}
    )
    # Normalise each day across tickers to the [-1, 1] range by z-scoring the row.
    rowmean = frame.mean(axis=1)
    rowstd = frame.std(axis=1).replace(0, np.nan)
    z = frame.sub(rowmean, axis=0).div(rowstd, axis=0)
    z = z.clip(-2.5, 2.5) / 2.5
    return z


# ---------------------------------------------------------------------------
# Options sentiment (cross-sectional)
# ---------------------------------------------------------------------------

def cross_sectional_pc_score(pc_ratio: pd.Series) -> pd.Series:
    """Given a Series of put/call ratios across sectors, return a -1..+1 score
    where high P/C (bearish options) maps to negative sentiment."""
    ranked = pc_ratio.rank(method="average")
    n = len(ranked)
    # High P/C = bearish = negative sentiment score.
    # Map rank 1 (lowest P/C) → +1, rank n → -1.
    normed = 1.0 - 2.0 * (ranked - 1) / max(1, n - 1)
    return normed


# ---------------------------------------------------------------------------
# Macro / risk appetite
# ---------------------------------------------------------------------------

def risk_appetite_score(macro: pd.DataFrame) -> pd.Series:
    """Combine VIX / yield curve / copper-gold into a single risk-on score.

    macro index = date; columns must include: VIX, TNX, IRX, HG, GC.
    Returns a Series (date) in [-1, +1]. Positive = risk-on.
    """
    df = macro.copy()

    components = []

    if {"VIX"}.issubset(df.columns):
        # Low VIX → risk-on. Use z-score of -VIX (252d).
        v = -df["VIX"]
        z = (v - v.rolling(252, min_periods=60).mean()) / v.rolling(
            252, min_periods=60
        ).std()
        components.append(z)

    if {"TNX", "IRX"}.issubset(df.columns):
        # Steeper curve (10Y - 3M) → risk-on.
        slope = df["TNX"] - df["IRX"]
        z = (slope - slope.rolling(252, min_periods=60).mean()) / slope.rolling(
            252, min_periods=60
        ).std()
        components.append(z)

    if {"HG", "GC"}.issubset(df.columns):
        # Copper/Gold ratio rising → risk-on / growth.
        ratio = df["HG"] / df["GC"]
        z = (ratio - ratio.rolling(252, min_periods=60).mean()) / ratio.rolling(
            252, min_periods=60
        ).std()
        components.append(z)

    if not components:
        return pd.Series(dtype=float)

    combined = pd.concat(components, axis=1).mean(axis=1)
    return combined.clip(-2.5, 2.5) / 2.5


def sector_macro_alignment(sector: str, appetite_score: float) -> float:
    """Map (sector, risk appetite) to a [-1, +1] alignment score.

    Defensives score positively when risk-off (appetite < 0).
    Cyclicals / growth score positively when risk-on (appetite > 0).
    """
    defensives = {"Health Care", "Utilities", "Consumer Staples"}
    cyclicals = {
        "Technology",
        "Consumer Discretionary",
        "Industrials",
        "Materials",
        "Financials",
        "Energy",
        "Communication Services",
    }
    neutral = {"Real Estate"}

    name = SECTOR_TICKERS.get(sector, sector)
    if name in defensives:
        return float(np.clip(-appetite_score, -1, 1))
    if name in cyclicals:
        return float(np.clip(appetite_score, -1, 1))
    if name in neutral:
        return 0.0
    return 0.0


# ---------------------------------------------------------------------------
# Composite score
# ---------------------------------------------------------------------------

COMPOSITE_WEIGHTS = {
    "rs_momentum": 0.30,
    "flow_momentum": 0.30,
    "options_sentiment": 0.20,
    "macro_alignment": 0.20,
}


def compute_composite(
    rs_mom: pd.Series,
    flow_mom: pd.Series,
    options_sent: pd.Series,
    macro_align: pd.Series,
) -> pd.DataFrame:
    """Combine four normalised [-1,+1] Series into a composite score DataFrame.

    All inputs are indexed by ticker. Missing values are treated as 0.
    Returns columns: rs_momentum, flow_momentum, options_sentiment, macro_alignment,
    composite_score, rotation_rank, signal_confluence.
    """
    df = pd.DataFrame(
        {
            "rs_momentum": rs_mom,
            "flow_momentum": flow_mom,
            "options_sentiment": options_sent,
            "macro_alignment": macro_align,
        }
    ).fillna(0.0)

    # Clip each to [-1, +1] in case upstream didn't.
    for col in df.columns:
        df[col] = df[col].clip(-1, 1)

    df["composite_score"] = sum(
        df[col] * w for col, w in COMPOSITE_WEIGHTS.items()
    )
    df["rotation_rank"] = (
        df["composite_score"].rank(ascending=False, method="min").astype(int)
    )

    # Signal confluence: how many signals point the same way as the composite.
    def confluence(row):
        direction = np.sign(row["composite_score"]) or 1
        agree = sum(
            1
            for col in COMPOSITE_WEIGHTS
            if np.sign(row[col]) == direction
        )
        return int(agree)

    df["signal_confluence"] = df.apply(confluence, axis=1)
    return df


def normalize_rs_momentum(rs_mom_pct: pd.Series) -> pd.Series:
    """Map 3-month RS % change into [-1, +1] using a ±6% reference scale."""
    return (rs_mom_pct / 6.0).clip(-1, 1)


# ---------------------------------------------------------------------------
# Lead-time analysis: does flow precede RS?
# ---------------------------------------------------------------------------

def compute_lead_time(
    flow_series: pd.Series, rs_series: pd.Series, max_lag: int = 40
) -> dict:
    """For a single ticker, find avg business-day lead of flow sign-flip vs RS sign-flip.

    Returns dict with avg_lead, observations, lead_rate.
    """
    flow_sign = np.sign(flow_series.fillna(0))
    rs_sign = np.sign(rs_series.fillna(0))

    flow_flips = flow_sign.diff().fillna(0).abs() > 0
    rs_flips = rs_sign.diff().fillna(0).abs() > 0

    flip_dates_flow = list(flow_series.index[flow_flips])
    flip_dates_rs = list(rs_series.index[rs_flips])

    leads = []
    lead_count = 0
    for f_date in flip_dates_flow:
        # next RS flip after this flow flip, within max_lag business days
        after = [d for d in flip_dates_rs if d > f_date]
        if not after:
            continue
        next_rs = after[0]
        diff_days = np.busday_count(
            f_date.date().isoformat(), next_rs.date().isoformat()
        )
        if 0 < diff_days <= max_lag:
            leads.append(diff_days)
            lead_count += 1

    obs = len(flip_dates_flow)
    return {
        "avg_lead_days": float(np.mean(leads)) if leads else None,
        "observations": obs,
        "lead_count": lead_count,
        "lead_rate": (lead_count / obs) if obs else None,
    }
