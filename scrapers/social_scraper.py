#!/usr/bin/env python3
"""Monitor Twitter for revenue announcements from tracked agents."""

import json
import os
import re
import sys
from urllib.request import urlopen, Request
from datetime import datetime

# Agents to monitor
TRACKED_ACCOUNTS = [
    "FelixCraftAI",
    "bottoproject",
    "AntiHunterAI",
    "JunoAgent",
    "KellyClaudeAI",
    "rentahuman",
    "clawgig",
]

# Revenue-related keywords
REVENUE_KEYWORDS = [
    "revenue", "earned", "profit", "sales", "income", "made",
    "milestone", "$", "customers", "paid", "sold", "payout",
]

BEARER_TOKEN = os.environ.get("TWITTER_BEARER_TOKEN", "")


def search_revenue_tweets(query: str, max_results: int = 10) -> list:
    """Search recent tweets for revenue announcements."""
    if not BEARER_TOKEN:
        print("[social_scraper] TWITTER_BEARER_TOKEN not set", file=sys.stderr)
        return []

    url = (
        f"https://api.twitter.com/2/tweets/search/recent"
        f"?query={query}&max_results={max_results}"
        f"&tweet.fields=created_at,author_id,public_metrics"
    )
    headers = {"Authorization": f"Bearer {BEARER_TOKEN}"}

    try:
        req = Request(url, headers=headers)
        with urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("data", [])
    except Exception as e:
        print(f"[social_scraper] Error: {e}", file=sys.stderr)
        return []


def get_user_tweets(username: str, max_results: int = 10) -> list:
    """Get recent tweets from a specific user."""
    if not BEARER_TOKEN:
        return []

    # First get user ID
    url = f"https://api.twitter.com/2/users/by/username/{username}"
    headers = {"Authorization": f"Bearer {BEARER_TOKEN}"}

    try:
        req = Request(url, headers=headers)
        with urlopen(req, timeout=15) as resp:
            user_data = json.loads(resp.read().decode("utf-8"))
            user_id = user_data["data"]["id"]
    except Exception as e:
        print(f"[social_scraper] Error getting user {username}: {e}", file=sys.stderr)
        return []

    # Get tweets
    url = (
        f"https://api.twitter.com/2/users/{user_id}/tweets"
        f"?max_results={max_results}"
        f"&tweet.fields=created_at,public_metrics"
    )
    try:
        req = Request(url, headers=headers)
        with urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("data", [])
    except Exception as e:
        print(f"[social_scraper] Error getting tweets: {e}", file=sys.stderr)
        return []


def extract_revenue_mentions(tweets: list) -> list:
    """Extract revenue-related information from tweets."""
    mentions = []
    dollar_pattern = r"\$[\d,]+\.?\d*[KkMm]?"

    for tweet in tweets:
        text = tweet.get("text", "")
        text_lower = text.lower()

        # Check if tweet mentions revenue
        if any(kw in text_lower for kw in REVENUE_KEYWORDS):
            amounts = re.findall(dollar_pattern, text)
            if amounts:
                mentions.append({
                    "text": text,
                    "amounts": amounts,
                    "created_at": tweet.get("created_at"),
                    "metrics": tweet.get("public_metrics"),
                })

    return mentions


def scrape_all():
    """Scrape all tracked accounts for revenue announcements."""
    results = {
        "scraped_at": datetime.utcnow().isoformat() + "Z",
        "accounts": {},
    }

    for account in TRACKED_ACCOUNTS:
        print(f"[social_scraper] Checking @{account}...", file=sys.stderr)
        tweets = get_user_tweets(account)
        mentions = extract_revenue_mentions(tweets)
        if mentions:
            results["accounts"][account] = mentions

    return results


if __name__ == "__main__":
    results = scrape_all()
    print(json.dumps(results, indent=2))
