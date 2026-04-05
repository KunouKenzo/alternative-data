"""
政府調達・入札落札データコレクター

調達ポータル (https://www.p-portal.go.jp/) のオープンデータAPIから
落札実績データ（CSV）をダウンロードし、Supabase + S3 に格納する。

CSV列構造（ヘッダーなし）:
  0: 案件番号
  1: 案件名
  2: 落札日 (YYYY-MM-DD)
  3: 落札金額
  4: 調達種別コード
  5: 機関コード
  6: 落札企業名
  7: 法人番号
"""

import csv
import io
import re
import zipfile
from datetime import datetime, timezone

import pandas as pd
import requests

from base import BaseCollector

BASE_URL = "https://api.p-portal.go.jp/pps-web-biz/UAB03/OAB0301"

# 機関コードから省庁への大まかなマッピング
ORG_CODE_MAP: dict[str, tuple[str, str]] = {
    # (担当省, 担当庁)
    "8001010": ("国土交通省", "航空局"),
    "8002010": ("法務省", ""),
    "8002020": ("財務省", ""),
    "8002040": ("国土交通省", "地方整備局"),
    "8002050": ("宮内庁", ""),
    "8003010": ("防衛省", ""),
    "8004020": ("国土交通省", "道路局"),
    "8004025": ("農林水産省", "林野庁"),
    "8004030": ("デジタル庁", ""),
    "8011010": ("各省庁", ""),
    "8014020": ("防衛省", "海上自衛隊"),
    "8014025": ("防衛省", "航空自衛隊"),
    "8014030": ("デジタル庁", ""),
}

# 案件名から省庁・機関を推定するパターン
MINISTRY_PATTERNS: list[tuple[str, str, str]] = [
    # (正規表現パターン, 担当省, 担当庁)
    (r"経済産業", "経済産業省", ""),
    (r"環境省", "環境省", ""),
    (r"厚生労働", "厚生労働省", ""),
    (r"文部科学", "文部科学省", ""),
    (r"農林水産", "農林水産省", ""),
    (r"国土交通", "国土交通省", ""),
    (r"総務省", "総務省", ""),
    (r"外務省", "外務省", ""),
    (r"財務省|国税", "財務省", ""),
    (r"法務省|検察|刑務所|拘置所|入国管理|法務局", "法務省", ""),
    (r"防衛省|自衛隊|防衛装備", "防衛省", ""),
    (r"内閣府|内閣官房", "内閣府", ""),
    (r"警察庁", "国家公安委員会", "警察庁"),
    (r"金融庁", "金融庁", ""),
    (r"デジタル庁", "デジタル庁", ""),
    (r"復興庁", "復興庁", ""),
    (r"こども家庭庁", "こども家庭庁", ""),
    (r"消費者庁", "消費者庁", ""),
    (r"宮内庁", "宮内庁", ""),
    (r"会計検査院", "会計検査院", ""),
    (r"人事院", "人事院", ""),
    (r"森林管理", "農林水産省", "林野庁"),
    (r"地方整備局", "国土交通省", "地方整備局"),
    (r"地方運輸局|運輸支局", "国土交通省", "地方運輸局"),
    (r"気象台|気象庁", "国土交通省", "気象庁"),
    (r"海上保安", "国土交通省", "海上保安庁"),
    (r"税関", "財務省", "税関"),
    (r"労働局|ハローワーク", "厚生労働省", ""),
    (r"年金", "厚生労働省", "日本年金機構"),
]

# 日本の会計年度: 4月始まり
DATASET_ID = "12dcea9f-bdc1-469f-a54f-4008dab666ee"
SOURCE_ID = "ec0d3a67-1755-45f6-afcf-0d0d48526342"


def _current_fiscal_year() -> int:
    """現在の会計年度を西暦で返す（4月始まり）"""
    now = datetime.now(timezone.utc)
    return now.year if now.month >= 4 else now.year - 1


def _detect_ministry(project_name: str, org_code: str) -> tuple[str, str]:
    """案件名と機関コードから (担当省, 担当庁) を推定"""
    # まず案件名からパターンマッチ
    for pattern, ministry, agency in MINISTRY_PATTERNS:
        if re.search(pattern, project_name):
            return ministry, agency

    # フォールバック: 機関コードから
    if org_code in ORG_CODE_MAP:
        return ORG_CODE_MAP[org_code]

    return "不明", ""


def _download_zip_csv(filename: str) -> str:
    """調達ポータルAPIからZIPをダウンロードしCSV文字列を返す"""
    url = f"{BASE_URL}?fileversion=v001&filename={filename}"
    resp = requests.get(url, timeout=120)
    resp.raise_for_status()

    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        csv_name = zf.namelist()[0]
        with zf.open(csv_name) as f:
            return f.read().decode("utf-8-sig")


def _parse_csv(csv_text: str) -> list[dict]:
    """ヘッダーなしCSVをパースしてレコードのリストを返す"""
    rows = []
    reader = csv.reader(io.StringIO(csv_text))
    for record in reader:
        if len(record) < 8:
            continue

        project_name = record[1].strip()
        org_code = record[5].strip()
        ministry, agency = _detect_ministry(project_name, org_code)

        amount_str = record[3].strip()
        try:
            award_amount = int(float(amount_str))
        except (ValueError, TypeError):
            award_amount = None

        rows.append({
            "project_name": project_name,
            "award_date": record[2].strip() or None,
            "award_amount": award_amount,
            "ministry": ministry,
            "agency": agency,
            "awarded_company": record[6].strip(),
            "source_url": "https://www.p-portal.go.jp/",
        })
    return rows


class GovProcurementCollector(BaseCollector):
    """政府調達・落札データコレクター"""

    def __init__(self):
        super().__init__(source_id=SOURCE_ID, name="GovProcurement")

    def collect(self) -> None:
        fy = _current_fiscal_year()
        self.logger.info("Collecting government procurement data for FY%d", fy)

        # 当年度と前年度の全件データをダウンロード
        all_rows: list[dict] = []
        for year in [fy, fy - 1]:
            filename = f"successful_bid_record_info_all_{year}.zip"
            try:
                self.logger.info("Downloading %s", filename)
                csv_text = _download_zip_csv(filename)
                rows = _parse_csv(csv_text)
                self.logger.info("Parsed %d records from FY%d", len(rows), year)
                all_rows.extend(rows)
            except Exception as e:
                self.logger.warning("Failed to download %s: %s", filename, e)

        if not all_rows:
            self.logger.error("No data collected")
            self.mark_error("No data collected from any source")
            return

        df = pd.DataFrame(all_rows)

        # 重複排除 (案件名 + 省 + 庁 + 落札日)
        df = df.drop_duplicates(
            subset=["project_name", "ministry", "agency", "award_date"],
            keep="last",
        )

        # 日付型に変換
        df["award_date"] = pd.to_datetime(df["award_date"], errors="coerce")

        # collected_at
        df["collected_at"] = datetime.now(timezone.utc).isoformat()

        self.logger.info("Total unique records: %d", len(df))

        # Supabaseへupsert
        records = df.where(df.notna(), None).to_dict("records")
        # award_dateを文字列に変換（JSON用）
        for r in records:
            if r.get("award_date") is not None:
                r["award_date"] = r["award_date"].strftime("%Y-%m-%d")

        # バッチでupsert (500件ずつ)
        batch_size = 500
        for i in range(0, len(records), batch_size):
            batch = records[i : i + batch_size]
            self.save_to_supabase("gov_procurement", batch)

        # S3へCSVエクスポート
        s3_key = self.export_to_s3(df, "gov-procurement")

        # データセットメタデータ更新
        self.update_dataset_metadata(DATASET_ID, df)

        self.mark_success(len(df))
        self.logger.info("Done. %d records stored, S3 key: %s", len(df), s3_key)


if __name__ == "__main__":
    collector = GovProcurementCollector()
    collector.run()
