"""Configuration for Steel Plant Satellite Activity Index pipeline.

Uses Sentinel-2 SWIR bands (B11, B12) to detect blast furnace / coke oven
hot spots following the TransitionZero methodology.
"""

import os

# ---------------------------------------------------------------------------
# GEE
# ---------------------------------------------------------------------------
GEE_PROJECT_ID = os.environ.get("GEE_PROJECT_ID", "")
GEE_COLLECTION = "COPERNICUS/S2_SR_HARMONIZED"
GEE_SCALE = 20  # metres per pixel (SWIR native resolution)

# ---------------------------------------------------------------------------
# Sentinel-2 band names
# ---------------------------------------------------------------------------
BAND_B11 = "B11"  # SWIR1 – 1610 nm
BAND_B12 = "B12"  # SWIR2 – 2190 nm
BAND_SCL = "SCL"  # Scene Classification Layer

# SCL values considered "valid" (not cloud / shadow / water)
# 4=Vegetation, 5=Bare soil, 6=Water, 7=Unclassified, 8=Cloud medium,
# 9=Cloud high, 10=Cirrus, 11=Snow
SCL_VALID_CLASSES = [2, 4, 5, 6, 7]  # Dark area, Vegetation, Bare, Water, Unclass

# ---------------------------------------------------------------------------
# Hot-pixel detection thresholds
#
# Sentinel-2 SR stores reflectance × 10 000.
# B12 = 0.1 reflectance  →  1000 in scaled units
# Typical land surface: 200-500;  active blast furnace: 1000-5000+
# ---------------------------------------------------------------------------
HOT_PIXEL_THRESHOLD = 2000  # scaled reflectance units (tuned: >1000 captures 69% ground reflection, >2000 captures 6.8% = thermal sources)
B12_NORM_CEILING = 5000     # ceiling for activity_score normalisation (tuned to match B12 max range)

# ---------------------------------------------------------------------------
# Cloud filter
# ---------------------------------------------------------------------------
MAX_CLOUD_PERCENTAGE = 30  # reject scenes above this %

# ---------------------------------------------------------------------------
# Activity score weights
# activity_score = (hot_pixel_ratio × WEIGHT_HPR) + (norm_b12 × WEIGHT_B12)
# ---------------------------------------------------------------------------
WEIGHT_HPR = 70
WEIGHT_B12 = 30

# ---------------------------------------------------------------------------
# Data quality thresholds (valid_pixels_pct)
# ---------------------------------------------------------------------------
QUALITY_GOOD_THRESHOLD = 80.0
QUALITY_MARGINAL_THRESHOLD = 50.0

# ---------------------------------------------------------------------------
# Backfill / rate-limit
# ---------------------------------------------------------------------------
GEE_MONTH_SLEEP_SEC = 2
GEE_RETRY_MAX = 3
GEE_RETRY_BACKOFF = 5  # base seconds for exponential backoff

# ---------------------------------------------------------------------------
# Supabase table names
# ---------------------------------------------------------------------------
TABLE_DAILY = "steel_plant_activity"
TABLE_MONTHLY = "steel_plant_activity_monthly"

# ---------------------------------------------------------------------------
# Supabase source / dataset IDs (register in alt_data_sources / alt_datasets)
# ---------------------------------------------------------------------------
SOURCE_ID = "c3d4e5f6-7890-abcd-ef01-333333333333"
DATASET_ID = "d4e5f6a7-8901-bcde-f012-444444444444"

# ---------------------------------------------------------------------------
# Facility definitions
# ---------------------------------------------------------------------------
FACILITIES = {
    "nippon_steel_kimitsu": {
        "name": "日本製鉄 東日本製鉄所 君津地区",
        "ticker": "5401",
        "center": (35.3833, 139.9167),
        "aoi": {
            "sw": (35.370, 139.900),
            "ne": (35.400, 139.940),
        },
    },
    "nippon_steel_kashima": {
        "name": "日本製鉄 東日本製鉄所 鹿島地区",
        "ticker": "5401",
        "center": (35.9667, 140.6333),
        "aoi": {
            "sw": (35.955, 140.615),
            "ne": (35.980, 140.650),
        },
    },
}
