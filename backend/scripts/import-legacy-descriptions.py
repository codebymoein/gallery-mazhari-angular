"""Safely attach legacy WooCommerce descriptions to existing catalog products.

Inventory, prices, publication status and product identity are never modified.
Matching is limited to an exact product code or a unique normalized product name.
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import re
import shutil
import sqlite3
import sys
import unicodedata
from collections import defaultdict
from datetime import datetime
from pathlib import Path


def normalize(value: str) -> str:
    value = html.unescape(value or "").replace("\u200c", " ")
    value = unicodedata.normalize("NFKC", value).casefold()
    value = re.sub(r"[^\w\u0600-\u06ff]+", " ", value)
    return " ".join(value.split())


def clean_html(value: str) -> str:
    value = value or ""
    value = re.sub(r"(?i)<\s*br\s*/?\s*>", "\n", value)
    value = re.sub(r"(?i)</\s*(p|div|li|h[1-6])\s*>", "\n", value)
    value = re.sub(r"(?i)<\s*li(?:\s[^>]*)?>", "• ", value)
    value = re.sub(r"<[^>]+>", "", value)
    value = html.unescape(value).replace("\xa0", " ").replace("\\n", "\n")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in value.splitlines()]
    return "\n".join(line for line in lines if line).strip()


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", required=True, type=Path)
    parser.add_argument("--csv", required=True, type=Path)
    parser.add_argument("--backup-dir", required=True, type=Path)
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()

    connection = sqlite3.connect(args.db)
    connection.row_factory = sqlite3.Row
    products = connection.execute(
        "SELECT id, code, name, category, description, enrichment FROM staging_products"
    ).fetchall()
    by_code = {normalize(row["code"]): row for row in products if row["code"]}
    by_name: dict[str, list[sqlite3.Row]] = defaultdict(list)
    for row in products:
        by_name[normalize(row["name"])].append(row)

    with args.csv.open("r", encoding="utf-8-sig", newline="") as stream:
        source_rows = list(csv.DictReader(stream))

    updates: dict[str, tuple[sqlite3.Row, str, str]] = {}
    ambiguous = unmatched = 0
    for source in source_rows:
        short = clean_html(source.get("توضیح کوتاه", ""))
        full = clean_html(source.get("توضیحات", ""))
        if not short and not full:
            continue
        code = normalize(source.get("شناسه محصول", ""))
        target = by_code.get(code) if code else None
        if target is None:
            matches = by_name.get(normalize(source.get("نام", "")), [])
            if len(matches) == 1:
                target = matches[0]
            elif len(matches) > 1:
                ambiguous += 1
                continue
        if target is None:
            unmatched += 1
            continue
        old = updates.get(target["id"])
        if old:
            short = short or old[1]
            full = full or old[2]
        updates[target["id"]] = (target, short, full)

    category_counts: dict[str, int] = defaultdict(int)
    for target, _, _ in updates.values():
        category_counts[target["category"]] += 1
    report = {
        "matchedProducts": len(updates),
        "withShortDescription": sum(bool(row[1]) for row in updates.values()),
        "withAdditionalDescription": sum(bool(row[2]) for row in updates.values()),
        "ambiguousRowsSkipped": ambiguous,
        "unmatchedRowsSkipped": unmatched,
        "categories": dict(sorted(category_counts.items())),
        "committed": args.commit,
    }

    if args.commit:
        args.backup_dir.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now().strftime("%Y-%m-%d-%H%M%S")
        backup = args.backup_dir / f"gallery-mazhari-before-legacy-descriptions-{stamp}.sqlite"
        connection.commit()
        shutil.copy2(args.db, backup)
        for target, short, full in updates.values():
            enrichment = json.loads(target["enrichment"] or "{}")
            if full:
                enrichment["additionalDescription"] = full[:12000]
            connection.execute(
                "UPDATE staging_products SET description = ?, enrichment = ?, updatedAt = datetime('now') WHERE id = ?",
                (short[:2000] if short else target["description"], json.dumps(enrichment, ensure_ascii=False), target["id"]),
            )
        connection.commit()
        report["backup"] = str(backup)

    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
