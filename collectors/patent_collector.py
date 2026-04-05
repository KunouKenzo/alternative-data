"""
特許データコレクター

JPO（日本特許庁）バルクデータおよびUSPTO（PatentsView API）から
特許出願・登録データを収集し、Supabase + S3 に格納する。

データソース:
  - J-PlatPat: https://www.j-platpat.inpit.go.jp/
  - PatentsView: https://patentsview.org/
"""

import re
import time
from datetime import datetime, timezone, timedelta

import pandas as pd
import requests

from base import BaseCollector

SOURCE_ID = "a1b2c3d4-5678-9abc-def0-111111111111"
DATASET_ID = "b2c3d4e5-6789-abcd-ef01-222222222222"

# 法人格サフィックス除去パターン
LEGAL_SUFFIXES = re.compile(
    r"\s*("
    r"株式会社|有限会社|合同会社|合資会社|合名会社|"
    r"一般社団法人|一般財団法人|公益社団法人|公益財団法人|"
    r"独立行政法人|国立研究開発法人|地方独立行政法人|"
    r"学校法人|医療法人|社会福祉法人|"
    r"Corporation|Corp\\.?|Incorporated|Inc\\.?|"
    r"Limited|Ltd\\.?|Co\\.?,?\\s*Ltd\\.?|"
    r"Company|GmbH|AG|S\\.?A\\.?|N\\.?V\\.?|"
    r"B\\.?V\\.?|S\\.?E\\.?|PLC|LLC|LLP|L\\.?P\\.?"
    r")\s*",
    re.IGNORECASE,
)

# 法人格プレフィックス除去パターン
LEGAL_PREFIXES = re.compile(
    r"^\s*(株式会社|有限会社|合同会社|独立行政法人|国立研究開発法人|学校法人)\s*",
)

PATENTSVIEW_BASE = "https://search.patentsview.org/api/v1/patent/"


class PatentCollector(BaseCollector):
    """特許データコレクター (JPO + USPTO)"""

    def __init__(self):
        super().__init__(source_id=SOURCE_ID, name="Patents")
        self._ipc_taxonomy: dict[str, str] = {}
        self._company_aliases: dict[str, tuple[str, str, str]] = {}

    def _load_ipc_taxonomy(self) -> None:
        """Supabaseからipc_prefix → technology_area マッピングを読み込む"""
        result = self.supabase.table("patent_ipc_taxonomy").select("*").execute()
        for row in result.data:
            self._ipc_taxonomy[row["ipc_prefix"]] = row["technology_area"]
        self.logger.info("Loaded %d IPC taxonomy entries", len(self._ipc_taxonomy))

    def _load_company_aliases(self) -> None:
        """Supabaseから企業名エイリアスを読み込む"""
        result = self.supabase.table("patent_company_aliases").select("*").execute()
        for row in result.data:
            self._company_aliases[row["alias"]] = (
                row["normalized_name"],
                row["canonical_name"],
                row["country"] or "",
            )
        self.logger.info("Loaded %d company aliases", len(self._company_aliases))

    # ------------------------------------------------------------------
    # 企業名正規化
    # ------------------------------------------------------------------

    def _normalize_applicant(self, raw_name: str) -> tuple[str, str, str]:
        """
        出願人名を正規化する。
        Returns: (normalized_name, canonical_name, country)
        """
        if not raw_name:
            return ("", "", "")

        raw_stripped = raw_name.strip()

        # エイリアステーブルで完全一致
        if raw_stripped in self._company_aliases:
            return self._company_aliases[raw_stripped]

        # アルゴリズム的正規化
        name = raw_stripped
        name = LEGAL_PREFIXES.sub("", name)
        name = LEGAL_SUFFIXES.sub(" ", name)
        name = re.sub(r"[,.\-\s]+", " ", name).strip().lower()

        # 国コード推定
        country = ""
        if any(ord(c) > 0x3000 for c in raw_stripped):
            country = "JP"

        return (name, raw_stripped, country)

    # ------------------------------------------------------------------
    # IPC → 技術分野マッピング
    # ------------------------------------------------------------------

    def _map_technology_area(self, ipc_codes: list[str]) -> str:
        """IPCコードリストから最も具体的な技術分野名を返す"""
        if not ipc_codes:
            return ""

        for ipc in ipc_codes:
            ipc_clean = ipc.strip()
            # 最も長いプレフィックスから照合 (具体的 → 一般的)
            for length in range(len(ipc_clean), 0, -1):
                prefix = ipc_clean[:length].rstrip()
                if prefix in self._ipc_taxonomy:
                    return self._ipc_taxonomy[prefix]

        return ""

    # ------------------------------------------------------------------
    # JPO データ収集
    # ------------------------------------------------------------------

    def _collect_jpo(self) -> list[dict]:
        """
        J-PlatPatからCSVバルクデータをダウンロードして特許レコードを返す。

        JPO公開特許公報の書誌データを取得:
        https://www.j-platpat.inpit.go.jp/ のオープンデータ
        """
        rows = []
        today = datetime.now(timezone.utc)

        # 直近の公開特許を取得 (過去4週間)
        # JPO特許データは週次で公開される
        # 初回は過去2年分を取得するが、通常は直近分のみ
        weeks_back = 4

        # 公開日の範囲
        date_from = (today - timedelta(weeks=weeks_back)).strftime("%Y%m%d")
        date_to = today.strftime("%Y%m%d")

        self.logger.info("Collecting JPO patents from %s to %s", date_from, date_to)

        # J-PlatPat 特許情報取得API
        # 公開特許公報の書誌情報を検索
        try:
            url = "https://www.j-platpat.inpit.go.jp/api/patent/search"
            # Note: J-PlatPat does not have a public bulk API.
            # We use their search endpoint with date range filtering.
            # For production, consider applying for INPIT's bulk data service.

            # J-PlatPatのWebスクレイピングではなく、
            # INPITの公開データサービスからCSVを取得する方式
            # https://www.jpo.go.jp/system/laws/sesaku/data/download.html
            #
            # JPO整理標準化データ: 特許公報テキスト情報
            # 公開日ベースでCSVファイルが提供される

            # JPO特許公報データのダウンロード
            jpo_base = "https://www.jpo.go.jp/system/laws/sesaku/data"

            # 特許出願の書誌情報を取得
            # 公報種別: A (公開特許公報)
            gazette_url = f"{jpo_base}/kokai_bibliographic.csv"

            self.logger.info("Attempting JPO bulk data download...")
            resp = requests.get(gazette_url, timeout=120)

            if resp.status_code == 200:
                rows = self._parse_jpo_csv(resp.text)
                self.logger.info("Collected %d JPO patent records", len(rows))
            else:
                self.logger.warning(
                    "JPO bulk download returned status %d, "
                    "falling back to sample data generation",
                    resp.status_code,
                )
                # JPOバルクデータがアクセスできない場合、
                # PatentsViewでJP出願の特許も取得する
                self.logger.info("Will supplement with USPTO data for JP applicants")

        except Exception as e:
            self.logger.warning("JPO collection failed: %s", e)
            self.logger.info("Continuing with USPTO collection only")

        return rows

    def _parse_jpo_csv(self, csv_text: str) -> list[dict]:
        """JPOバルクCSVをパースしてレコードリストを返す"""
        import csv
        import io

        rows = []
        reader = csv.reader(io.StringIO(csv_text))

        # ヘッダースキップ
        header = next(reader, None)
        if not header:
            return rows

        for record in reader:
            if len(record) < 6:
                continue

            try:
                patent_number = record[0].strip()
                title = record[1].strip() if len(record) > 1 else ""
                applicant = record[2].strip() if len(record) > 2 else ""
                filing_date_str = record[3].strip() if len(record) > 3 else ""
                publication_date_str = record[4].strip() if len(record) > 4 else ""
                ipc_str = record[5].strip() if len(record) > 5 else ""

                # 日付パース
                filing_date = None
                if filing_date_str:
                    try:
                        filing_date = datetime.strptime(
                            filing_date_str, "%Y%m%d"
                        ).strftime("%Y-%m-%d")
                    except ValueError:
                        pass

                publication_date = None
                if publication_date_str:
                    try:
                        publication_date = datetime.strptime(
                            publication_date_str, "%Y%m%d"
                        ).strftime("%Y-%m-%d")
                    except ValueError:
                        pass

                # IPCコード分割
                ipc_codes = [c.strip() for c in ipc_str.split(";") if c.strip()]
                ipc_main = ipc_codes[0] if ipc_codes else None

                rows.append({
                    "source": "jpo",
                    "patent_number": f"JP{patent_number}",
                    "title": title,
                    "title_en": None,
                    "abstract": None,
                    "filing_date": filing_date,
                    "publication_date": publication_date,
                    "grant_date": None,
                    "status": "application",
                    "applicant_name_raw": applicant,
                    "ipc_codes": ipc_codes if ipc_codes else None,
                    "ipc_main": ipc_main,
                    "cpc_codes": None,
                    "cpc_main": None,
                    "source_url": f"https://www.j-platpat.inpit.go.jp/c1800/PU/JP-{patent_number}/",
                })
            except Exception as e:
                self.logger.debug("Failed to parse JPO record: %s", e)
                continue

        return rows

    # ------------------------------------------------------------------
    # USPTO データ収集 (PatentsView API)
    # ------------------------------------------------------------------

    def _collect_uspto(self) -> list[dict]:
        """PatentsView APIから米国特許データを取得する"""
        rows = []
        today = datetime.now(timezone.utc)

        # 直近4週間の特許を取得
        date_from = (today - timedelta(weeks=4)).strftime("%Y-%m-%d")

        self.logger.info("Collecting USPTO patents from %s via PatentsView", date_from)

        # PatentsView API v1
        # ページネーションで全件取得
        page = 0
        per_page = 1000
        total_fetched = 0
        max_pages = 50  # 安全上限

        while page < max_pages:
            try:
                params = {
                    "q": f'{{"_gte":{{"patent_date":"{date_from}"}}}}',
                    "f": '["patent_id","patent_title","patent_abstract","patent_date","patent_type","patent_num_claims"]',
                    "o": f'{{"page":{page},"per_page":{per_page}}}',
                    "s": '[{"patent_date":"desc"}]',
                }

                resp = requests.get(
                    PATENTSVIEW_BASE,
                    params=params,
                    timeout=60,
                    headers={"Accept": "application/json"},
                )

                if resp.status_code == 429:
                    self.logger.warning("Rate limited, waiting 30s...")
                    time.sleep(30)
                    continue

                if resp.status_code != 200:
                    self.logger.warning(
                        "PatentsView API returned %d: %s",
                        resp.status_code,
                        resp.text[:500],
                    )
                    break

                data = resp.json()
                patents = data.get("patents", [])

                if not patents:
                    break

                for p in patents:
                    patent_id = p.get("patent_id", "")
                    patent_title = p.get("patent_title", "")
                    patent_abstract = p.get("patent_abstract", "")
                    patent_date = p.get("patent_date")

                    # Assignee情報取得
                    assignees = p.get("assignees", [])
                    applicant_raw = ""
                    applicant_country = ""
                    if assignees:
                        first = assignees[0]
                        org = first.get("assignee_organization", "")
                        fname = first.get("assignee_first_name", "")
                        lname = first.get("assignee_last_name", "")
                        applicant_raw = org if org else f"{fname} {lname}".strip()
                        applicant_country = first.get("assignee_country", "")

                    # CPC/IPCコード
                    cpcs = p.get("cpcs", [])
                    cpc_codes = [c.get("cpc_group_id", "") for c in cpcs if c.get("cpc_group_id")]
                    cpc_main = cpc_codes[0] if cpc_codes else None

                    ipcs = p.get("ipcs", [])
                    ipc_codes = [i.get("ipc_code", "") for i in ipcs if i.get("ipc_code")]
                    ipc_main = ipc_codes[0] if ipc_codes else None

                    rows.append({
                        "source": "uspto",
                        "patent_number": f"US{patent_id}",
                        "title": patent_title,
                        "title_en": patent_title,
                        "abstract": patent_abstract,
                        "filing_date": None,
                        "publication_date": patent_date,
                        "grant_date": patent_date,
                        "status": "granted",
                        "applicant_name_raw": applicant_raw,
                        "applicant_country": applicant_country,
                        "ipc_codes": ipc_codes if ipc_codes else None,
                        "ipc_main": ipc_main,
                        "cpc_codes": cpc_codes if cpc_codes else None,
                        "cpc_main": cpc_main,
                        "source_url": f"https://patentsview.org/patent/{patent_id}",
                    })

                total_fetched += len(patents)
                self.logger.info(
                    "Fetched page %d: %d patents (total: %d)",
                    page, len(patents), total_fetched,
                )

                if len(patents) < per_page:
                    break

                page += 1
                time.sleep(1.5)  # レート制限遵守

            except requests.RequestException as e:
                self.logger.warning("PatentsView request failed on page %d: %s", page, e)
                break

        self.logger.info("Collected %d USPTO patent records total", len(rows))
        return rows

    # ------------------------------------------------------------------
    # メインの collect()
    # ------------------------------------------------------------------

    def collect(self) -> None:
        # マッピングテーブル読み込み
        self._load_ipc_taxonomy()
        self._load_company_aliases()

        # 各ソースから独立して収集
        jpo_rows = []
        uspto_rows = []

        try:
            jpo_rows = self._collect_jpo()
        except Exception as e:
            self.logger.error("JPO collection error: %s", e)

        try:
            uspto_rows = self._collect_uspto()
        except Exception as e:
            self.logger.error("USPTO collection error: %s", e)

        all_rows = jpo_rows + uspto_rows

        if not all_rows:
            self.logger.error("No patent data collected from any source")
            self.mark_error("No patent data collected from any source")
            return

        self.logger.info(
            "Total raw records: %d (JPO: %d, USPTO: %d)",
            len(all_rows), len(jpo_rows), len(uspto_rows),
        )

        # 企業名正規化 + 技術分野マッピング
        for row in all_rows:
            norm, canonical, country = self._normalize_applicant(
                row.get("applicant_name_raw", "")
            )
            row["applicant_name_normalized"] = norm
            row["applicant_name_en"] = row.get("applicant_name_en") or canonical
            if not row.get("applicant_country"):
                row["applicant_country"] = country

            ipc_codes = row.get("ipc_codes") or []
            row["technology_area"] = self._map_technology_area(ipc_codes)

            row["collected_at"] = datetime.now(timezone.utc).isoformat()

        # DataFrameに変換
        df = pd.DataFrame(all_rows)

        # Supabaseへupsert (500件バッチ)
        records = df.where(df.notna(), None).to_dict("records")

        # リスト型カラムの None → None 処理 (Supabaseが空配列を受け付けるように)
        for r in records:
            for col in ("ipc_codes", "cpc_codes"):
                if r.get(col) is not None and isinstance(r[col], list) and len(r[col]) == 0:
                    r[col] = None

        batch_size = 500
        for i in range(0, len(records), batch_size):
            batch = records[i : i + batch_size]
            self.save_to_supabase("patents", batch)

        # S3へCSVエクスポート
        s3_key = self.export_to_s3(df, "patents")

        # データセットメタデータ更新
        self.update_dataset_metadata(DATASET_ID, df)

        self.mark_success(len(df))
        self.logger.info("Done. %d patent records stored, S3 key: %s", len(df), s3_key)


if __name__ == "__main__":
    collector = PatentCollector()
    collector.run()
