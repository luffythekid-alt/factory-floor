#!/usr/bin/env python3
"""Master script: runs all scrapers and updates the data JSON."""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
DATA_FILE = SCRIPT_DIR.parent / "src" / "data" / "agents.json"
SCRAPE_LOG = SCRIPT_DIR / "scrape_log.json"

# Import scrapers
sys.path.insert(0, str(SCRIPT_DIR))
from felix_scraper import scrape_felix, parse_dollar_amount
from social_scraper import scrape_all as scrape_social


def load_agents() -> list:
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def save_agents(agents: list):
    with open(DATA_FILE, "w") as f:
        json.dump(agents, f, indent=2)
    print(f"[update_data] Saved {len(agents)} agents to {DATA_FILE}")


def update_felix(agents: list, felix_data: dict | None):
    """Update Felix revenue from dashboard scrape."""
    if not felix_data:
        return

    total_text = felix_data.get("total_revenue_text")
    if total_text:
        amount = parse_dollar_amount(total_text)
        if amount:
            for agent in agents:
                if agent["id"] == "felix":
                    agent["totalRevenue"] = amount
                    print(f"[update_data] Updated Felix revenue: ${amount:,.0f}")
                    break


def update_from_social(agents: list, social_data: dict):
    """Update agents from social media revenue mentions."""
    # Log interesting findings but don't auto-update (requires manual review)
    accounts = social_data.get("accounts", {})
    if accounts:
        print(f"[update_data] Found revenue mentions from: {list(accounts.keys())}")
        for account, mentions in accounts.items():
            for m in mentions:
                print(f"  @{account}: {m['amounts']} — {m['text'][:100]}...")


def main():
    print(f"[update_data] Starting scrape at {datetime.utcnow().isoformat()}Z")
    print("=" * 60)

    agents = load_agents()
    log = {"started_at": datetime.utcnow().isoformat() + "Z", "results": {}}

    # 1. Felix dashboard
    print("\n[1/2] Scraping Felix dashboard...")
    felix_data = scrape_felix()
    log["results"]["felix"] = felix_data or {"error": "no data"}
    update_felix(agents, felix_data)

    # 2. Social media
    print("\n[2/2] Scraping social media...")
    social_data = scrape_social()
    log["results"]["social"] = {
        "accounts_with_mentions": list(social_data.get("accounts", {}).keys())
    }
    update_from_social(agents, social_data)

    # Save
    save_agents(agents)

    log["completed_at"] = datetime.utcnow().isoformat() + "Z"
    with open(SCRAPE_LOG, "w") as f:
        json.dump(log, f, indent=2)
    print(f"\n[update_data] Done. Log saved to {SCRAPE_LOG}")


if __name__ == "__main__":
    main()
