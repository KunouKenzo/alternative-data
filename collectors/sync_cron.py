#!/usr/bin/env python3
"""Synchronise crontab entries from manifest.json.

Reads collectors/manifest.json, removes any existing crontab lines tagged
with ``# altdata:<id>``, and installs fresh entries for every enabled
collector.
"""

import json
import subprocess
import sys
from pathlib import Path

MANIFEST = Path(__file__).resolve().parent / "manifest.json"
ALTDATA_TAG_PREFIX = "# altdata:"


def current_crontab() -> str:
    """Return the current crontab contents (empty string if none)."""
    try:
        result = subprocess.run(
            ["crontab", "-l"],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode == 0:
            return result.stdout
    except FileNotFoundError:
        pass
    return ""


def install_crontab(content: str) -> None:
    """Install the given string as the user's crontab."""
    proc = subprocess.run(
        ["crontab", "-"],
        input=content,
        text=True,
        check=True,
    )


def main() -> None:
    with open(MANIFEST) as f:
        manifest = json.load(f)

    collectors = manifest.get("collectors", [])

    # Read existing crontab and strip altdata-managed lines
    existing = current_crontab()
    kept_lines: list[str] = []
    for line in existing.splitlines():
        if ALTDATA_TAG_PREFIX in line:
            continue
        kept_lines.append(line)

    # Build new entries for enabled collectors
    for col in collectors:
        if not col.get("enabled", False):
            continue
        cid = col["id"]
        schedule = col["schedule"]
        script = col["script"]
        entry = (
            f"{schedule} cd ~/app && python3 {script} "
            f">> ~/app/logs/{cid}.log 2>&1 {ALTDATA_TAG_PREFIX}{cid}"
        )
        kept_lines.append(entry)

    new_crontab = "\n".join(kept_lines)
    if new_crontab and not new_crontab.endswith("\n"):
        new_crontab += "\n"

    install_crontab(new_crontab)

    enabled_count = sum(1 for c in collectors if c.get("enabled", False))
    print(f"Crontab synced: {enabled_count} enabled collector(s) installed.")


if __name__ == "__main__":
    main()
