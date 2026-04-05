"""Reddit Crypto Sentiment Collector

Collects newest posts from r/Bitcoin and r/CryptoCurrency every 4 hours,
storing individual post snapshots and daily aggregated metrics.

Usage:
    python collectors/reddit_crypto_collector.py
"""

import statistics
import time
from datetime import datetime, timezone, timedelta

import pandas as pd
import requests

from collectors.base import BaseCollector

SOURCE_ID = "caf71ff4-7dae-4e70-83b4-26aed7adff70"
DATASET_ID = "c1904ff0-bdc3-46f1-be62-cecd8939cb4b"

SUBREDDITS = ["Bitcoin", "CryptoCurrency"]
POSTS_PER_SUB = 100
REQUEST_DELAY_SEC = 2

TABLE_POSTS = "reddit_crypto_posts"
TABLE_DAILY = "reddit_crypto_daily"

USER_AGENT = "data-platform:reddit-crypto-collector:v1.0 (by /u/altdata_collector)"


class RedditCryptoCollector(BaseCollector):

    def __init__(self):
        super().__init__(source_id=SOURCE_ID, name="RedditCrypto")
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})

    # ------------------------------------------------------------------
    # Fetch
    # ------------------------------------------------------------------

    def _fetch_subreddit(self, subreddit: str) -> list[dict]:
        """Fetch newest posts from a subreddit's public JSON API."""
        url = f"https://www.reddit.com/r/{subreddit}/new.json"
        collected_at = (
            datetime.now(timezone.utc)
            .replace(minute=0, second=0, microsecond=0)
            .isoformat()
        )

        rows: list[dict] = []
        after = None

        # Paginate to collect up to POSTS_PER_SUB posts
        while len(rows) < POSTS_PER_SUB:
            params = {"limit": min(100, POSTS_PER_SUB - len(rows)), "raw_json": 1}
            if after:
                params["after"] = after

            resp = self._request_with_retry(url, params)
            if resp is None:
                break

            data = resp.json().get("data", {})
            children = data.get("children", [])
            if not children:
                break

            for child in children:
                post = child.get("data", {})
                rows.append(self._parse_post(post, subreddit, collected_at))

            after = data.get("after")
            if not after:
                break

            time.sleep(REQUEST_DELAY_SEC)

        self.logger.info("Fetched %d posts from r/%s", len(rows), subreddit)
        return rows

    def _request_with_retry(
        self, url: str, params: dict, max_retries: int = 3
    ) -> requests.Response | None:
        """GET with exponential backoff for 429/5xx."""
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
                    self.logger.warning("Request error: %s, retrying in %ds", exc, delays[attempt])
                    time.sleep(delays[attempt])
                else:
                    raise
        return None

    def _parse_post(self, post: dict, subreddit: str, collected_at: str) -> dict:
        """Convert Reddit API post object to a table row."""
        created = datetime.fromtimestamp(post.get("created_utc", 0), tz=timezone.utc)
        selftext = post.get("selftext", "") or ""
        return {
            "post_id": post.get("id", ""),
            "subreddit": subreddit,
            "collected_at": collected_at,
            "title": post.get("title", ""),
            "selftext": selftext[:2000],
            "author": post.get("author", ""),
            "score": post.get("score", 0),
            "upvote_ratio": post.get("upvote_ratio", 0.0),
            "num_comments": post.get("num_comments", 0),
            "created_utc": created.isoformat(),
            "permalink": post.get("permalink", ""),
            "link_flair_text": post.get("link_flair_text"),
            "is_self": post.get("is_self", False),
            "domain": post.get("domain", ""),
        }

    # ------------------------------------------------------------------
    # Persist
    # ------------------------------------------------------------------

    def _upsert_posts(self, rows: list[dict]) -> None:
        """Upsert post snapshots with conflict on (post_id, collected_at)."""
        if not rows:
            return
        batch_size = 500
        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]
            self.supabase.table(TABLE_POSTS).upsert(
                batch, on_conflict="post_id,collected_at"
            ).execute()
        self.logger.info("Upserted %d post snapshots", len(rows))

    # ------------------------------------------------------------------
    # Aggregation
    # ------------------------------------------------------------------

    def _aggregate_daily(self, subreddit: str) -> None:
        """Recompute daily aggregates from post snapshots for the last 3 days."""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()

        resp = (
            self.supabase.table(TABLE_POSTS)
            .select("post_id,score,upvote_ratio,num_comments,created_utc,author,is_self,collected_at")
            .eq("subreddit", subreddit)
            .gte("created_utc", cutoff)
            .order("collected_at", desc=True)
            .limit(5000)
            .execute()
        )

        if not resp.data:
            return

        # Deduplicate: keep the latest snapshot per post_id
        seen = set()
        latest_posts: list[dict] = []
        for row in resp.data:  # already ordered by collected_at desc
            if row["post_id"] not in seen:
                seen.add(row["post_id"])
                latest_posts.append(row)

        # Group by date (from created_utc)
        by_date: dict[str, list[dict]] = {}
        for post in latest_posts:
            date_str = post["created_utc"][:10]  # YYYY-MM-DD
            by_date.setdefault(date_str, []).append(post)

        daily_rows = []
        for date_str, posts in by_date.items():
            scores = [p["score"] for p in posts]
            ratios = [p["upvote_ratio"] for p in posts if p["upvote_ratio"] is not None]
            authors = {p["author"] for p in posts}
            self_posts = [p["is_self"] for p in posts if p["is_self"] is not None]

            daily_rows.append({
                "date": date_str,
                "subreddit": subreddit,
                "post_count": len(posts),
                "total_comments": sum(p["num_comments"] for p in posts),
                "avg_score": round(sum(scores) / len(scores), 2) if scores else 0,
                "median_score": round(statistics.median(scores), 2) if scores else 0,
                "avg_upvote_ratio": round(sum(ratios) / len(ratios), 4) if ratios else 0,
                "total_score": sum(scores),
                "max_score": max(scores) if scores else 0,
                "unique_authors": len(authors),
                "self_post_ratio": round(
                    sum(1 for s in self_posts if s) / len(self_posts), 4
                ) if self_posts else 0,
            })

        if daily_rows:
            self.supabase.table(TABLE_DAILY).upsert(
                daily_rows, on_conflict="date,subreddit"
            ).execute()
            self.logger.info(
                "Upserted %d daily aggregate rows for r/%s", len(daily_rows), subreddit
            )

    # ------------------------------------------------------------------
    # S3 export
    # ------------------------------------------------------------------

    def _export_daily_to_s3(self) -> None:
        """Export daily aggregates to S3."""
        resp = (
            self.supabase.table(TABLE_DAILY)
            .select("*")
            .order("date", desc=True)
            .limit(365)
            .execute()
        )
        if resp.data:
            df = pd.DataFrame(resp.data)
            self.export_to_s3(df, "reddit-crypto-sentiment")
            self.update_dataset_metadata(DATASET_ID, df)

    # ------------------------------------------------------------------
    # Main
    # ------------------------------------------------------------------

    def collect(self) -> None:
        """Main collection entry point."""
        total_rows = 0

        for i, subreddit in enumerate(SUBREDDITS):
            rows = self._fetch_subreddit(subreddit)
            if rows:
                self._upsert_posts(rows)
                total_rows += len(rows)
            self._aggregate_daily(subreddit)

            if i < len(SUBREDDITS) - 1:
                time.sleep(REQUEST_DELAY_SEC)

        self._export_daily_to_s3()
        self.mark_success(total_rows)


if __name__ == "__main__":
    collector = RedditCryptoCollector()
    collector.run()
