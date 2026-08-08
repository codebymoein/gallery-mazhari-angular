#!/usr/bin/env python3
"""Validate RM-12 sitemap canonical/public URL governance."""
from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
SITE_ORIGIN = "https://gallery-mazhari.ir"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
BLOCKED_PREFIXES = (
    "/account",
    "/admin",
    "/cart",
    "/checkout",
    "/orders",
    "/dream-canvas",
    "/catalog-builder",
)


def fail(message: str) -> None:
    print(f"sitemap validation failed: {message}", file=sys.stderr)
    raise SystemExit(1)


def parse_xml(path: Path) -> ET.Element:
    try:
        return ET.parse(path).getroot()
    except (OSError, ET.ParseError) as exc:
        fail(f"{path.relative_to(ROOT)} is not parseable XML: {exc}")


def validate_public_url(url: str, seen: set[str]) -> None:
    parsed = urlparse(url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    if origin != SITE_ORIGIN:
        fail(f"URL must use canonical origin {SITE_ORIGIN}: {url}")
    if parsed.query or parsed.fragment:
        fail(f"URL must not contain query or fragment: {url}")
    if parsed.path != "/" and parsed.path.endswith("/"):
        fail(f"non-root canonical URL must not have a trailing slash: {url}")
    if any(parsed.path == prefix or parsed.path.startswith(f"{prefix}/") for prefix in BLOCKED_PREFIXES):
        fail(f"private/noindex route must not be in sitemap: {url}")
    if url in seen:
        fail(f"duplicate canonical URL: {url}")
    seen.add(url)


def main() -> None:
    index_path = SRC / "sitemap.xml"
    root = parse_xml(index_path)
    if root.tag != f"{{{NS['sm']}}}sitemapindex":
        fail("src/sitemap.xml must be a sitemap index")

    sitemap_locations = [node.text.strip() for node in root.findall("sm:sitemap/sm:loc", NS) if node.text]
    if not sitemap_locations:
        fail("sitemap index contains no sitemap locations")

    seen_sitemaps: set[str] = set()
    seen_urls: set[str] = set()
    for location in sitemap_locations:
        validate_public_url(location, seen_sitemaps)
        parsed = urlparse(location)
        filename = Path(parsed.path).name
        if filename == "sitemap.xml":
            fail("sitemap index must not reference itself")
        child_path = SRC / filename
        child_root = parse_xml(child_path)
        if child_root.tag != f"{{{NS['sm']}}}urlset":
            fail(f"{filename} must contain a urlset")
        locations = [node.text.strip() for node in child_root.findall("sm:url/sm:loc", NS) if node.text]
        if not locations:
            fail(f"{filename} contains no public URLs")
        for url in locations:
            validate_public_url(url, seen_urls)

    print(
        f"sitemap validation passed: {len(sitemap_locations)} partitions, "
        f"{len(seen_urls)} unique canonical public URLs"
    )


if __name__ == "__main__":
    main()
