#!/usr/bin/env python3
"""Scrape Felix revenue data from felixcraft.ai/dashboard."""

import json
import re
import sys
from urllib.request import urlopen, Request
from datetime import datetime


def scrape_felix():
    """Fetch felixcraft.ai/dashboard and extract revenue figures."""
    url = "https://felixcraft.ai/dashboard"
    headers = {"User-Agent": "FactoryFloor/1.0 (revenue tracker)"}

    try:
        req = Request(url, headers=headers)
        with urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8")
    except Exception as e:
        print(f"[felix_scraper] Error fetching dashboard: {e}", file=sys.stderr)
        return None

    # Try to extract revenue figures from the page
    # These patterns may need updating as the dashboard evolves
    data = {"scraped_at": datetime.utcnow().isoformat() + "Z", "source": url}

    # Look for dollar amounts
    dollar_pattern = r"\$[\d,]+\.?\d*[KkMm]?"
    amounts = re.findall(dollar_pattern, html)
    if amounts:
        data["raw_amounts_found"] = amounts

    # Look for common revenue labels
    for label in ["total revenue", "total earned", "lifetime", "all time"]:
        pattern = rf"(?i){label}[^$]*(\$[\d,]+\.?\d*[KkMm]?)"
        match = re.search(pattern, html)
        if match:
            data["total_revenue_text"] = match.group(1)
            break

    # Try JSON-LD or embedded data
    json_pattern = r'<script[^>]*type="application/json"[^>]*>(.*?)</script>'
    for match in re.finditer(json_pattern, html, re.DOTALL):
        try:
            embedded = json.loads(match.group(1))
            data["embedded_json"] = embedded
            break
        except json.JSONDecodeError:
            continue

    return data


def parse_dollar_amount(text: str) -> float | None:
    """Convert '$5.2M', '$50K', '$1,234' to float."""
    if not text:
        return None
    text = text.replace("$", "").replace(",", "").strip()
    multiplier = 1
    if text[-1].upper() == "M":
        multiplier = 1_000_000
        text = text[:-1]
    elif text[-1].upper() == "K":
        multiplier = 1_000
        text = text[:-1]
    try:
        return float(text) * multiplier
    except ValueError:
        return None


if __name__ == "__main__":
    result = scrape_felix()
    if result:
        print(json.dumps(result, indent=2))
    else:
        print("No data scraped", file=sys.stderr)
        sys.exit(1)
