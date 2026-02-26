#!/usr/bin/env python3
"""
Factory Floor — Hourly data updater
Pulls market caps from DEXScreener, stores historical snapshots,
and updates agents.json with latest data + growth rates.
"""

import json
import os
import re
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
AGENTS_JSON = BASE_DIR / "src" / "data" / "agents.json"
HISTORY_DIR = BASE_DIR / "data" / "history"
REVENUE_LOG = HISTORY_DIR / "revenue-log.json"
SEEN_TWEETS = HISTORY_DIR / "seen-revenue-tweets.json"
HISTORY_DIR.mkdir(parents=True, exist_ok=True)

# Token contract addresses on Base (for DEXScreener)
TOKEN_CONTRACTS = {
    "felix": "0xf30Bf00edd0C22db54C9274B90D2A4C21FC09b07",
    "antihunter": None,  # search by name
    "kelly": None,       # search by name
    "juno": None,        # search by name
}

# DEXScreener search queries for tokens without known contracts
TOKEN_SEARCH = {
    "antihunter": "antihunter",
    "kelly": "kellyclaude",
    "juno": "juno agent",
}

# Twitter handles to monitor for revenue updates
AGENT_TWITTER = {
    "felix": "FelixCraftAI",
    "antihunter": "AntiHunterAI",
    "juno": "JunoAgent",
    "kelly": "KellyClaudeAI",
}

# Keywords that signal a revenue update
REVENUE_KEYWORDS = [
    "revenue", "earned", "sales", "income", "profit",
    "week 1", "week 2", "week 3", "week 4", "week 5", "week 6", "week 7", "week 8",
    "weekly", "monthly", "lifetime", "total revenue", "first revenue",
    "treasury", "stripe", "paid", "membership", "subscriber",
]

# Patterns to extract dollar amounts
DOLLAR_PATTERNS = [
    r'\$[\d,]+(?:\.\d{1,2})?(?:K|k)?',        # $1,234 or $1.5K
    r'[\d,]+(?:\.\d{1,2})?\s*(?:USD|usd)',      # 1234 USD
    r'[\d,]+(?:\.\d{1,2})?\s*(?:ETH|eth)',       # 16.66 ETH
]

def get_twitter_bearer():
    """Get Twitter bearer token."""
    key = "my5Cl2ysdAU2KgLOAFXjQTyH6"
    secret = "J1opGABktjZBgnJdCGyPLK54DWdY2pQMuzSVyEY5vsmeMX7aAR"
    import base64
    creds = base64.b64encode(f"{key}:{secret}".encode()).decode()
    req = urllib.request.Request(
        "https://api.twitter.com/oauth2/token",
        data=b"grant_type=client_credentials",
        headers={
            "Authorization": f"Basic {creds}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())["access_token"]

def fetch_twitter(url, bearer):
    """Fetch from Twitter API with bearer token."""
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {bearer}",
        "User-Agent": "FactoryFloor/1.0",
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

def load_seen_tweets():
    """Load set of already-processed tweet IDs."""
    if SEEN_TWEETS.exists():
        with open(SEEN_TWEETS) as f:
            return json.load(f)
    return {}

def save_seen_tweets(seen):
    with open(SEEN_TWEETS, "w") as f:
        json.dump(seen, f, indent=2)

def is_revenue_tweet(text):
    """Check if tweet text contains revenue-related keywords."""
    lower = text.lower()
    return any(kw in lower for kw in REVENUE_KEYWORDS)

def extract_dollar_amounts(text):
    """Extract dollar amounts from tweet text."""
    amounts = []
    for pattern in DOLLAR_PATTERNS:
        matches = re.findall(pattern, text)
        amounts.extend(matches)
    return amounts

def check_twitter_revenue(agents, bearer):
    """Check agent Twitter accounts for revenue updates. Returns list of findings."""
    seen = load_seen_tweets()
    findings = []

    for agent in agents:
        aid = agent["id"]
        handle = AGENT_TWITTER.get(aid)
        if not handle:
            continue

        try:
            # Get user ID
            user_data = fetch_twitter(
                f"https://api.twitter.com/2/users/by/username/{handle}?user.fields=id",
                bearer
            )
            user_id = user_data.get("data", {}).get("id")
            if not user_id:
                print(f"    Twitter: @{handle} not found")
                continue

            # Get recent tweets (last 10)
            tweets_data = fetch_twitter(
                f"https://api.twitter.com/2/users/{user_id}/tweets"
                f"?max_results=10&tweet.fields=created_at,public_metrics,text"
                f"&exclude=retweets",
                bearer
            )
            tweets = tweets_data.get("data", [])
            if not tweets:
                continue

            agent_seen = seen.get(aid, [])

            for tweet in tweets:
                tid = tweet["id"]
                if tid in agent_seen:
                    continue

                text = tweet.get("text", "")
                if is_revenue_tweet(text):
                    amounts = extract_dollar_amounts(text)
                    finding = {
                        "agent_id": aid,
                        "agent_name": agent["name"],
                        "handle": handle,
                        "tweet_id": tid,
                        "tweet_url": f"https://x.com/{handle}/status/{tid}",
                        "created_at": tweet.get("created_at", ""),
                        "text": text[:500],
                        "amounts_found": amounts,
                        "likes": tweet.get("public_metrics", {}).get("like_count", 0),
                    }
                    findings.append(finding)
                    agent_seen.append(tid)
                    print(f"    📊 Revenue tweet from @{handle}: {amounts if amounts else 'keyword match, no $ amount'}")

            seen[aid] = agent_seen[-50:]  # keep last 50 tweet IDs per agent

        except Exception as e:
            print(f"    Twitter error for @{handle}: {e}")

    save_seen_tweets(seen)
    return findings

def save_revenue_findings(findings):
    """Append revenue findings to a pending review file."""
    pending_path = HISTORY_DIR / "pending-revenue-updates.json"
    existing = []
    if pending_path.exists():
        with open(pending_path) as f:
            existing = json.load(f)

    existing.extend(findings)

    # Keep last 100
    existing = existing[-100:]

    with open(pending_path, "w") as f:
        json.dump(existing, f, indent=2)


def fetch_json(url):
    """Fetch JSON from URL."""
    req = urllib.request.Request(url, headers={"User-Agent": "FactoryFloor/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

def get_market_cap_by_contract(contract):
    """Get market cap from DEXScreener by contract address."""
    try:
        data = fetch_json(f"https://api.dexscreener.com/latest/dex/tokens/{contract}")
        pairs = data.get("pairs", [])
        if pairs:
            # Take the highest liquidity pair
            best = max(pairs, key=lambda p: float(p.get("liquidity", {}).get("usd", 0) or 0))
            return {
                "marketCap": best.get("marketCap"),
                "price": float(best.get("priceUsd", 0) or 0),
                "volume24h": float(best.get("volume", {}).get("h24", 0) or 0),
                "liquidity": float(best.get("liquidity", {}).get("usd", 0) or 0),
                "priceChange24h": float(best.get("priceChange", {}).get("h24", 0) or 0),
            }
    except Exception as e:
        print(f"  Error fetching by contract: {e}")
    return None

def get_market_cap_by_search(query):
    """Get market cap from DEXScreener by search query."""
    try:
        data = fetch_json(f"https://api.dexscreener.com/latest/dex/search?q={urllib.request.quote(query)}")
        pairs = data.get("pairs", [])
        # Filter to Base chain
        base_pairs = [p for p in pairs if p.get("chainId") == "base"]
        if base_pairs:
            best = max(base_pairs, key=lambda p: float(p.get("liquidity", {}).get("usd", 0) or 0))
            return {
                "marketCap": best.get("marketCap"),
                "price": float(best.get("priceUsd", 0) or 0),
                "volume24h": float(best.get("volume", {}).get("h24", 0) or 0),
                "liquidity": float(best.get("liquidity", {}).get("usd", 0) or 0),
                "priceChange24h": float(best.get("priceChange", {}).get("h24", 0) or 0),
            }
    except Exception as e:
        print(f"  Error fetching by search: {e}")
    return None

def get_market_data(agent_id):
    """Get market data for an agent token."""
    contract = TOKEN_CONTRACTS.get(agent_id)
    if contract:
        return get_market_cap_by_contract(contract)
    
    search = TOKEN_SEARCH.get(agent_id)
    if search:
        return get_market_cap_by_search(search)
    
    return None

def load_history(agent_id):
    """Load historical snapshots for an agent."""
    path = HISTORY_DIR / f"{agent_id}.json"
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return {"snapshots": []}

def save_history(agent_id, history):
    """Save historical snapshots for an agent."""
    path = HISTORY_DIR / f"{agent_id}.json"
    with open(path, "w") as f:
        json.dump(history, f, indent=2)

def calc_growth(history, hours=168):
    """Calculate growth rate over N hours (default 168 = 1 week)."""
    snapshots = history.get("snapshots", [])
    if len(snapshots) < 2:
        return None
    
    now = snapshots[-1]
    cutoff = now["timestamp"] - (hours * 3600)
    
    # Find closest snapshot to cutoff
    past = None
    for s in snapshots:
        if s["timestamp"] >= cutoff:
            past = s
            break
    
    if not past or past == now:
        # Try the oldest we have
        past = snapshots[0]
    
    if past["marketCap"] and now["marketCap"] and past["marketCap"] > 0:
        mcap_growth = ((now["marketCap"] - past["marketCap"]) / past["marketCap"]) * 100
    else:
        mcap_growth = None
    
    if past.get("totalRevenue") and now.get("totalRevenue") and past["totalRevenue"] > 0:
        rev_growth = ((now["totalRevenue"] - past["totalRevenue"]) / past["totalRevenue"]) * 100
    else:
        rev_growth = None
    
    return {
        "mcapGrowthPct": round(mcap_growth, 2) if mcap_growth is not None else None,
        "revenueGrowthPct": round(rev_growth, 2) if rev_growth is not None else None,
        "periodHours": hours,
    }

def run():
    now = datetime.now(timezone.utc)
    ts = int(now.timestamp())
    print(f"[{now.isoformat()}] Factory Floor hourly update")
    
    # Load agents
    with open(AGENTS_JSON) as f:
        agents = json.load(f)
    
    # --- Twitter revenue check ---
    print("\n  📊 Checking Twitter for revenue updates...")
    try:
        bearer = get_twitter_bearer()
        findings = check_twitter_revenue(agents, bearer)
        if findings:
            save_revenue_findings(findings)
            print(f"\n  ⚡ {len(findings)} new revenue tweet(s) found! Saved to pending-revenue-updates.json")
            # Print summary
            for f in findings:
                print(f"    → @{f['handle']}: {f['amounts_found']} | {f['tweet_url']}")
        else:
            print("    No new revenue tweets")
    except Exception as e:
        print(f"    Twitter check failed: {e}")

    # --- Market cap updates ---
    updated = False
    
    for agent in agents:
        aid = agent["id"]
        print(f"\n  Processing {agent['name']}...")
        
        # Fetch market data
        mdata = get_market_data(aid)
        if mdata and mdata["marketCap"]:
            old_mcap = agent.get("tokenMarketCap")
            new_mcap = mdata["marketCap"]
            agent["tokenMarketCap"] = new_mcap
            print(f"    Market cap: ${old_mcap:,} -> ${new_mcap:,}" if old_mcap else f"    Market cap: ${new_mcap:,}")
            updated = True
        else:
            print(f"    Market cap: no data")
            mdata = {"marketCap": agent.get("tokenMarketCap"), "price": 0, "volume24h": 0, "liquidity": 0, "priceChange24h": 0}
        
        # Store snapshot
        history = load_history(aid)
        snapshot = {
            "timestamp": ts,
            "datetime": now.isoformat(),
            "marketCap": mdata.get("marketCap"),
            "price": mdata.get("price"),
            "volume24h": mdata.get("volume24h"),
            "liquidity": mdata.get("liquidity"),
            "priceChange24h": mdata.get("priceChange24h"),
            "totalRevenue": agent.get("totalRevenue"),
        }
        history["snapshots"].append(snapshot)
        
        # Keep max 30 days of hourly data (720 snapshots)
        if len(history["snapshots"]) > 720:
            history["snapshots"] = history["snapshots"][-720:]
        
        save_history(aid, history)
        
        # Calculate growth rates
        wow = calc_growth(history, hours=168)  # week over week
        if wow:
            print(f"    WoW mcap growth: {wow['mcapGrowthPct']}%")
            if wow['revenueGrowthPct'] is not None:
                print(f"    WoW revenue growth: {wow['revenueGrowthPct']}%")
    
    # Save updated agents.json
    if updated:
        with open(AGENTS_JSON, "w") as f:
            json.dump(agents, f, indent=2)
        print(f"\n  ✓ agents.json updated")
    
    # Write last update timestamp
    meta = {
        "lastUpdate": now.isoformat(),
        "lastUpdateTs": ts,
    }
    with open(BASE_DIR / "data" / "meta.json", "w") as f:
        json.dump(meta, f, indent=2)
    
    print(f"\n  ✓ Done. Snapshots stored in {HISTORY_DIR}")

if __name__ == "__main__":
    run()
