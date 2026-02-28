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
    "antihunter": "0xe2f3FaE4bc62E21826018364aa30ae45D430bb07",
    "kelly": "0x50D2280441372486BeecdD328c1854743EBaCb07",
    "juno": "0x4E6c9f48f73E54EE5F3AB7e2992B2d733D0d0b07",
    "clawd": "0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07",
    "lauki": "0xebECb4e1e3Cf94b450D20e9AbF50D85CB5579b07",
}

# Clanker API key for fee data
CLANKER_API_KEY = "factory-floor-bdfgut234joinfgmu90-tr6v5e"

# Clanker platform fee recipient (40% of all fees)
CLANKER_FEE_RECIPIENT = "0xF60633D02690e2A15A54AB919925F3d038Df163e"

# DEXScreener search queries (fallback for tokens without contracts)
TOKEN_SEARCH = {}

# Twitter handles to monitor for revenue updates (agent + creator)
# ONLY for agents WITHOUT a live dashboard API
# Felix and Juno have APIs — skip twitter for them
AGENT_TWITTER = {
    "antihunter": ["AntiHunterAI", "geoffreywoo"],
}

# Keywords that signal a revenue update
REVENUE_KEYWORDS = [
    "revenue", "earned", "sales", "income", "profit",
    "week 1", "week 2", "week 3", "week 4", "week 5", "week 6", "week 7", "week 8",
    "weekly", "monthly", "lifetime", "total revenue", "first revenue",
    "treasury", "stripe", "paid", "membership", "subscriber",
]

# Keywords that signal trajectory-changing activity
# Keep this tight — only big moves that change the agent's story
ACTIVITY_KEYWORDS = [
    # new product launches (not updates)
    "just launched", "now live", "app store", "new product",
    # partnerships & deals with real money
    "partnership", "partnered", "sponsorship", "my price",
    # fundraising
    "raised", "funding", "investment",
    # acquisitions
    "acquisition", "acquired",
    # first-time milestones
    "first revenue", "first sale", "first customer", "first paying",
    # hiring (agent hiring humans is notable)
    "hired", "hiring",
]

# All agent twitter handles (for activity monitoring — all agents, not just API-less ones)
ALL_AGENT_TWITTER = {
    "felix": ["FelixCraftAI"],
    "antihunter": ["AntiHunterAI"],
    "juno": ["JunoAgent"],
    "kelly-claude": ["KellyClaudeAI"],
    "clawd": ["clawdbotatg"],
    "lauki": ["laukiantonson"],
}

SEEN_ACTIVITY = HISTORY_DIR / "seen-activity-tweets.json"

# Patterns to extract dollar amounts (use word boundaries to avoid partial matches)
DOLLAR_PATTERNS = [
    r'\$[\d,]+(?:\.\d{1,2})?(?:[Kk]|[Mm])?\b',  # $1,234 or $1.5K or $2M
    r'\b[\d,]+(?:\.\d{1,2})?\s*(?:USD|usd)\b',    # 1234 USD
    r'\b[\d,]+(?:\.\d{1,2})?\s*(?:ETH|eth)\b',     # 16.66 ETH
]

# Minimum dollar amount to consider as revenue (filters noise)
MIN_REVENUE_THRESHOLD = 50

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
    """Extract dollar amounts from tweet text. Returns list of (raw_str, numeric_value) tuples."""
    amounts = []
    for pattern in DOLLAR_PATTERNS:
        matches = re.findall(pattern, text)
        for m in matches:
            amounts.append(m)
    return amounts

def parse_dollar(s):
    """Parse a dollar string like '$16,411.90' or '$77K' into a float. Returns None if unparseable."""
    s = s.strip().rstrip(',')
    s = re.sub(r'[USD|usd|ETH|eth]', '', s).strip()
    s = s.replace('$', '').replace(',', '').strip()
    if not s:
        return None
    try:
        if s.upper().endswith('K'):
            return float(s[:-1]) * 1000
        elif s.upper().endswith('M'):
            return float(s[:-1]) * 1_000_000
        return float(s)
    except ValueError:
        return None

def classify_revenue_tweet(text):
    """Classify what kind of revenue the tweet is reporting.
    Returns dict with parsed fields or None if can't classify."""
    lower = text.lower()
    amounts = extract_dollar_amounts(text)
    if not amounts:
        return None

    result = {
        "amounts_raw": amounts,
        "is_product_revenue": False,
        "is_trading_fee": False,
        "is_treasury": False,
        "product_revenue": None,
        "trading_fee_revenue": None,
        "treasury_value": None,
        "total_revenue": None,
    }

    # Look for explicit product revenue signals
    product_signals = ["stripe", "sales", "membership", "ebook", "book sales",
                       "product revenue", "earned", "net revenue", "app store",
                       "first revenue", "sponsorship", "clawmart", "claw mart"]
    fee_signals = ["trading fee", "trading fees", "eth from trading", "fee revenue"]
    treasury_signals = ["treasury", "weth", "crypto treasury", "balance sheet"]

    has_product = any(s in lower for s in product_signals)
    has_fee = any(s in lower for s in fee_signals)
    has_treasury = any(s in lower for s in treasury_signals)

    # Try to extract the largest dollar amount as the headline number
    parsed = [(a, parse_dollar(a)) for a in amounts]
    parsed = [(a, v) for a, v in parsed if v is not None and v > 0]
    parsed.sort(key=lambda x: x[1], reverse=True)

    if has_product and parsed:
        # Find the amount most likely to be product revenue
        # Usually the first/smallest non-treasury amount, or explicitly labeled
        result["is_product_revenue"] = True
        # If there's a clear "stripe revenue" or similar, use the associated number
        # Simple heuristic: if multiple amounts, smallest is usually product, largest is treasury
        if has_treasury and len(parsed) >= 2:
            result["product_revenue"] = min(v for _, v in parsed)
            result["treasury_value"] = max(v for _, v in parsed)
            result["is_treasury"] = True
        else:
            result["product_revenue"] = parsed[0][1]

    if has_fee and parsed:
        result["is_trading_fee"] = True
        # ETH amounts are usually fees
        eth_amounts = [a for a in amounts if 'ETH' in a or 'eth' in a]
        if eth_amounts:
            result["trading_fee_revenue_raw"] = eth_amounts

    if has_treasury and not has_product and parsed:
        result["is_treasury"] = True
        result["treasury_value"] = parsed[0][1]

    # If we found product revenue, set total
    if result["product_revenue"]:
        result["total_revenue"] = result["product_revenue"]
        if result.get("trading_fee_revenue"):
            result["total_revenue"] += result["trading_fee_revenue"]

    return result

def check_twitter_revenue(agents, bearer):
    """Check agent + creator Twitter accounts for revenue updates. Returns list of findings."""
    seen = load_seen_tweets()
    findings = []

    for agent in agents:
        aid = agent["id"]
        handles = AGENT_TWITTER.get(aid, [])
        if not handles:
            continue

        for handle in handles:
            try:
                time.sleep(1.5)  # rate limit: ~1 req/sec for free tier
                # Get user ID
                user_data = fetch_twitter(
                    f"https://api.twitter.com/2/users/by/username/{handle}?user.fields=id",
                    bearer
                )
                user_id = user_data.get("data", {}).get("id")
                if not user_id:
                    print(f"    Twitter: @{handle} not found")
                    continue

                time.sleep(1.5)
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

                handle_seen = seen.get(f"{aid}:{handle}", [])

                for tweet in tweets:
                    tid = tweet["id"]
                    if tid in handle_seen:
                        continue

                    text = tweet.get("text", "")
                    if not is_revenue_tweet(text):
                        handle_seen.append(tid)
                        continue

                    classified = classify_revenue_tweet(text)
                    amounts = extract_dollar_amounts(text)

                    finding = {
                        "agent_id": aid,
                        "agent_name": agent["name"],
                        "handle": handle,
                        "is_creator": handle != AGENT_TWITTER[aid][0],
                        "tweet_id": tid,
                        "tweet_url": f"https://x.com/{handle}/status/{tid}",
                        "created_at": tweet.get("created_at", ""),
                        "text": text[:500],
                        "amounts_found": amounts,
                        "classified": classified,
                        "likes": tweet.get("public_metrics", {}).get("like_count", 0),
                    }
                    findings.append(finding)
                    handle_seen.append(tid)

                    if classified and classified.get("product_revenue"):
                        print(f"    💰 @{handle}: product revenue ${classified['product_revenue']:,.0f}")
                    elif amounts:
                        print(f"    📊 @{handle}: {amounts}")
                    else:
                        print(f"    📊 @{handle}: revenue keyword match, no $ amount")

                seen[f"{aid}:{handle}"] = handle_seen[-50:]

            except Exception as e:
                print(f"    Twitter error for @{handle}: {e}")

    save_seen_tweets(seen)
    return findings

def auto_apply_revenue(agents, findings):
    """Auto-apply revenue updates from classified tweets to agents.json.
    Only applies when we have high-confidence product revenue from agent's own account."""
    applied = []

    for f in findings:
        c = f.get("classified")
        if not c or not c.get("product_revenue"):
            continue

        aid = f["agent_id"]
        agent = next((a for a in agents if a["id"] == aid), None)
        if not agent:
            continue

        new_rev = c["product_revenue"]
        old_rev = agent.get("productRevenue") or 0

        # Skip tiny amounts that are likely noise
        if new_rev < MIN_REVENUE_THRESHOLD:
            continue

        # Only update if new number is higher (revenue shouldn't go down)
        if new_rev <= old_rev:
            continue

        # Determine confidence: agent's own account = high, creator = medium
        confidence = "high" if not f["is_creator"] else "medium"

        agent["productRevenue"] = new_rev
        agent["totalRevenue"] = new_rev
        agent["revenueConfidence"] = confidence

        if c.get("trading_fee_revenue"):
            agent["tradingFeeRevenue"] = c["trading_fee_revenue"]

        # Update revenue log
        log_entry = {
            "date": f["created_at"][:10] if f["created_at"] else datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "productRevenue": new_rev,
            "tradingFeeRevenue": c.get("trading_fee_revenue"),
            "totalRevenue": new_rev,
            "treasuryValue": c.get("treasury_value"),
            "note": f"Auto-detected from @{f['handle']}",
            "source": f["tweet_url"],
            "confidence": confidence,
            "auto_applied": True,
        }

        # Append to revenue log
        if REVENUE_LOG.exists():
            with open(REVENUE_LOG) as fl:
                rev_log = json.load(fl)
        else:
            rev_log = {}

        if aid not in rev_log:
            rev_log[aid] = []
        rev_log[aid].append(log_entry)

        with open(REVENUE_LOG, "w") as fl:
            json.dump(rev_log, fl, indent=2)

        applied.append({
            "agent": agent["name"],
            "old": old_rev,
            "new": new_rev,
            "source": f["tweet_url"],
            "confidence": confidence,
        })
        print(f"    ✅ Auto-applied: {agent['name']} ${old_rev:,.0f} → ${new_rev:,.0f} ({confidence}) via @{f['handle']}")

    return applied

def save_revenue_findings(findings):
    """Append all revenue findings to log for audit trail."""
    pending_path = HISTORY_DIR / "revenue-tweet-log.json"
    existing = []
    if pending_path.exists():
        with open(pending_path) as f:
            existing = json.load(f)

    for f in findings:
        # Strip classified object for cleaner logging
        entry = {k: v for k, v in f.items() if k != "classified"}
        entry["had_revenue_data"] = bool(f.get("classified", {}).get("product_revenue"))
        existing.append(entry)

    # Keep last 500
    existing = existing[-500:]

    with open(pending_path, "w") as f:
        json.dump(existing, f, indent=2)


def is_activity_tweet(text):
    """Check if tweet contains notable activity keywords.
    Filters out replies (starts with @) and short conversational tweets."""
    lower = text.lower()
    stripped = text.strip()

    # Skip replies (starts with @mention)
    if stripped.startswith("@"):
        return False
    # Skip short tweets (likely conversational)
    if len(stripped) < 60:
        return False
    # Must match at least one keyword
    if not any(kw in lower for kw in ACTIVITY_KEYWORDS):
        return False
    return True

def summarize_activity(text, max_len=120):
    """Create a short summary from tweet text for the activity feed."""
    # Strip URLs
    clean = re.sub(r'https?://\S+', '', text).strip()
    # Strip @mentions at start
    clean = re.sub(r'^(@\w+\s*)+', '', clean).strip()
    # Collapse whitespace
    clean = re.sub(r'\s+', ' ', clean).strip()
    if len(clean) > max_len:
        clean = clean[:max_len].rsplit(' ', 1)[0] + '…'
    return clean

def load_seen_activity():
    if SEEN_ACTIVITY.exists():
        with open(SEEN_ACTIVITY) as f:
            return json.load(f)
    return {}

def save_seen_activity(seen):
    with open(SEEN_ACTIVITY, "w") as f:
        json.dump(seen, f, indent=2)

def check_twitter_activity(agents, bearer):
    """Monitor all agent Twitter accounts for notable activity. Updates recentActivity in agents."""
    seen = load_seen_activity()
    updates = 0

    for agent in agents:
        aid = agent["id"]
        handles = ALL_AGENT_TWITTER.get(aid, [])
        if not handles:
            continue

        for handle in handles:
            try:
                time.sleep(1.5)
                user_data = fetch_twitter(
                    f"https://api.twitter.com/2/users/by/username/{handle}?user.fields=id",
                    bearer
                )
                user_id = user_data.get("data", {}).get("id")
                if not user_id:
                    continue

                time.sleep(1.5)
                tweets_data = fetch_twitter(
                    f"https://api.twitter.com/2/users/{user_id}/tweets"
                    f"?max_results=10&tweet.fields=created_at,public_metrics,text,in_reply_to_user_id"
                    f"&exclude=retweets,replies",
                    bearer
                )
                tweets = tweets_data.get("data", [])
                if not tweets:
                    continue

                handle_seen = seen.get(f"{aid}:{handle}", [])
                existing_urls = {a.get("url", "") for a in agent.get("recentActivity", [])}
                added_this_run = 0  # max 1 per agent per run to keep it curated

                for tweet in tweets:
                    tid = tweet["id"]
                    if tid in handle_seen:
                        continue
                    handle_seen.append(tid)

                    if added_this_run >= 1:
                        continue

                    text = tweet.get("text", "")
                    tweet_url = f"https://x.com/{handle}/status/{tid}"

                    # Skip if already in activity feed
                    if tweet_url in existing_urls:
                        continue

                    # Skip replies that slipped through
                    if tweet.get("in_reply_to_user_id"):
                        continue

                    # Check if it's trajectory-changing activity
                    is_activity = is_activity_tweet(text)

                    if not is_activity:
                        continue

                    summary = summarize_activity(text)
                    if not summary or len(summary) < 10:
                        continue

                    # Add to front of recentActivity
                    if "recentActivity" not in agent:
                        agent["recentActivity"] = []

                    tweet_date = tweet.get("created_at", "") or datetime.now(timezone.utc).isoformat()
                    agent["recentActivity"].insert(0, {
                        "text": summary,
                        "url": tweet_url,
                        "date": tweet_date,
                    })

                    # Cap at 5 recent activities
                    agent["recentActivity"] = agent["recentActivity"][:5]

                    updates += 1
                    added_this_run += 1
                    print(f"    📌 @{handle}: {summary[:80]}")

                # Keep last 100 seen tweet IDs per handle
                seen[f"{aid}:{handle}"] = handle_seen[-100:]

            except Exception as e:
                print(f"    Activity check error for @{handle}: {e}")

    save_seen_activity(seen)
    return updates


def check_product_launches(agents, bearer):
    """Monitor agent tweets for new product launches / app approvals.
    Auto-converts in_progress products to shipped and updates names."""
    print("\n  📦 Checking for product launches...")
    updates = 0

    launch_keywords = [
        "approved", "app store approved", "now available", "just went live",
        "launched on app store", "live on the app store", "available now",
        "download now", "app is live", "shipped", "released",
    ]

    for agent in agents:
        aid = agent["id"]
        handles = ALL_AGENT_TWITTER.get(aid, [])
        if not handles:
            continue

        in_progress = [p for p in agent.get("products", []) if p.get("status") == "in_progress"]
        if not in_progress:
            continue

        for handle in handles:
            try:
                time.sleep(1.5)
                user_data = fetch_twitter(
                    f"https://api.twitter.com/2/users/by/username/{handle}?user.fields=id",
                    bearer
                )
                user_id = user_data.get("data", {}).get("id")
                if not user_id:
                    continue

                time.sleep(1.5)
                tweets_data = fetch_twitter(
                    f"https://api.twitter.com/2/users/{user_id}/tweets"
                    f"?max_results=10&tweet.fields=created_at,text"
                    f"&exclude=retweets,replies",
                    bearer
                )
                tweets = tweets_data.get("data", [])

                for tweet in tweets:
                    text = tweet.get("text", "")
                    lower = text.lower()

                    if not any(kw in lower for kw in launch_keywords):
                        continue

                    # Found a launch tweet — convert first in_progress to shipped
                    # Try to extract app name from tweet
                    if in_progress:
                        p = in_progress.pop(0)
                        p["status"] = "shipped"
                        # Try to get a better name from the tweet (first ~40 chars before any URL)
                        clean = re.sub(r'https?://\S+', '', text).strip()
                        clean = re.sub(r'^(@\w+\s*)+', '', clean).strip()
                        if len(clean) > 10 and len(clean) < 60:
                            p["name"] = clean[:50]
                        updates += 1
                        print(f"    📦 {agent['name']}: product launched — {p['name']}")

            except Exception as e:
                print(f"    Product check error for @{handle}: {e}")

    return updates


def fetch_clanker_fees(agents):
    """Fetch trading fee data from Clanker API for all agents with token contracts."""
    print("\n  💰 Checking Clanker trading fees...")
    updated = False

    # First get ETH price from DEXScreener
    eth_price = 2000  # fallback
    try:
        data = fetch_json("https://api.dexscreener.com/latest/dex/search?q=WETH%20USDC%20base")
        pairs = [p for p in data.get("pairs", []) if p.get("chainId") == "base"
                 and p.get("baseToken", {}).get("symbol") == "WETH"]
        if pairs:
            eth_price = float(pairs[0]["priceUsd"])
            print(f"    ETH price: ${eth_price:,.0f}")
    except Exception as e:
        print(f"    ETH price fetch failed, using ${eth_price}: {e}")

    for agent in agents:
        aid = agent["id"]
        contract = TOKEN_CONTRACTS.get(aid)
        if not contract:
            continue

        try:
            # Get token info to find fee recipients
            req = urllib.request.Request(
                f"https://www.clanker.world/api/get-clanker-by-address?address={contract}",
                headers={"x-api-key": CLANKER_API_KEY, "User-Agent": "FactoryFloor/1.0"})
            token_data = json.loads(urllib.request.urlopen(req, timeout=15).read())
            td = token_data.get("data", token_data)
            recipients = td.get("extensions", {}).get("fees", {}).get("recipients", [])

            total_fee_eth = 0.0
            total_claims = 0

            for r in recipients:
                recipient = r.get("recipient", "")
                if not recipient:
                    continue
                try:
                    time.sleep(0.5)
                    req2 = urllib.request.Request(
                        f"https://www.clanker.world/api/get-claimed-fees/{contract}/{recipient}",
                        headers={"x-api-key": CLANKER_API_KEY, "User-Agent": "FactoryFloor/1.0"})
                    fee_data = json.loads(urllib.request.urlopen(req2, timeout=15).read())
                    claimed_wei = int(fee_data.get("totalClaimed", 0))
                    claimed_eth = claimed_wei / 1e18
                    claims = fee_data.get("claimCount", 0)
                    total_fee_eth += claimed_eth
                    total_claims += claims
                except Exception:
                    pass  # timeout on some recipients is normal

            if total_fee_eth > 0:
                fee_usd = round(total_fee_eth * eth_price)
                old_fee = agent.get("tradingFeeRevenue") or 0
                if fee_usd > old_fee:
                    agent["tradingFeeRevenue"] = fee_usd
                    updated = True
                print(f"    {agent['name']}: {total_fee_eth:.4f} ETH (${fee_usd:,}) from {total_claims} fee claims")
            else:
                print(f"    {agent['name']}: no fee data")

        except Exception as e:
            print(f"    {agent['name']} clanker error: {e}")

    return updated


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
    
    # --- Dashboard API revenue checks ---
    print("\n  📊 Checking live dashboards...")
    try:
        # Felix: felixcraft.ai/api/dashboard-data
        felix_data = fetch_json("https://felixcraft.ai/api/dashboard-data")
        felix_rev = felix_data.get("revenue", {})
        felix_daily = felix_rev.get("daily", [])
        if felix_daily:
            total_cents = sum(d["amount"] for d in felix_daily)
            total_usd = total_cents / 100
            # Last 7 days
            last7 = sum(d["amount"] for d in felix_daily[-7:]) / 100
            felix_agent = next((a for a in agents if a["id"] == "felix"), None)
            if felix_agent:
                old_rev = felix_agent.get("productRevenue") or 0
                if total_usd > old_rev:
                    felix_agent["productRevenue"] = round(total_usd)
                    felix_agent["totalRevenue"] = round(total_usd)
                    felix_agent["revenue7d"] = round(last7)
                    felix_agent["revenueConfidence"] = "high"
                    # Calculate WoW if we have 14+ days
                    if len(felix_daily) >= 14:
                        this_week = sum(d["amount"] for d in felix_daily[-7:])
                        last_week = sum(d["amount"] for d in felix_daily[-14:-7])
                        if last_week > 0:
                            felix_agent["revenueGrowthWoW"] = round(((this_week - last_week) / last_week) * 100, 1)
                    updated = True
                    print(f"    Felix: ${total_usd:,.0f} product revenue (${last7:,.0f} last 7d)")

                    # Build weekly revenue array from daily data
                    weeks = []
                    labels = []
                    for i in range(0, len(felix_daily), 7):
                        chunk = felix_daily[i:i+7]
                        week_total = sum(d["amount"] for d in chunk) / 100
                        weeks.append(round(week_total))
                        labels.append(f"W{len(labels)+1}")
                    felix_agent["weeklyRevenue"] = weeks
                    felix_agent["weeklyRevenueLabels"] = labels

            # Also grab treasury data
            treasury = felix_data.get("treasury", {})
            eth_held = float(treasury.get("eth", 0) or 0)
            if eth_held > 0:
                print(f"    Felix treasury: {eth_held:.2f} ETH")
    except Exception as e:
        print(f"    Felix dashboard error: {e}")

    try:
        # Juno: zhcinstitute.com/api/business-metrics/
        juno_data = fetch_json("https://www.zhcinstitute.com/api/business-metrics/")
        juno_rev = juno_data.get("revenue", {})
        total_cents = juno_rev.get("total", 0)
        total_usd = total_cents / 100
        week_cents = juno_rev.get("thisWeek", 0)
        week_usd = week_cents / 100
        juno_agent = next((a for a in agents if a["id"] == "juno"), None)
        if juno_agent and total_usd > (juno_agent.get("productRevenue") or 0):
            juno_agent["productRevenue"] = round(total_usd)
            juno_agent["totalRevenue"] = round(total_usd)
            juno_agent["revenue7d"] = round(week_usd)
            juno_agent["revenueConfidence"] = "high"
            # WoW: thisWeek vs lastMonth/4 as proxy (imperfect)
            last_month = juno_rev.get("lastMonth", 0) / 100
            if last_month > 0:
                avg_week_last_month = last_month / 4
                if avg_week_last_month > 0:
                    juno_agent["revenueGrowthWoW"] = round(((week_usd - avg_week_last_month) / avg_week_last_month) * 100, 1)
            # No real daily data from Juno API — don't fabricate weekly charts
            juno_agent["weeklyRevenue"] = None
            juno_agent["weeklyRevenueLabels"] = None
            juno_agent["revenueGrowthWoW"] = None

            # Update product-level revenue
            by_product = juno_rev.get("byProduct", {})
            product_map = {
                "Membership": "ZHC Institute Membership",
                "Challenge Sponsorship": "Challenge Sponsorship",
                "Other": "Other Revenue",
                "Ebook": "Ebook",
            }
            for api_name, product_name in product_map.items():
                if api_name in by_product:
                    for p in juno_agent.get("products", []):
                        if p["name"] == product_name:
                            p["revenue"] = round(by_product[api_name] / 100)

            updated = True
            print(f"    Juno: ${total_usd:,.0f} product revenue (${week_usd:,.0f} this week)")

        members = juno_data.get("members", {})
        print(f"    Juno members: {members.get('total', '?')} total")
    except Exception as e:
        print(f"    Juno dashboard error: {e}")

    try:
        # Kelly: iamkelly.ai — 3 revenue APIs (Stripe, Gumroad, App Store)
        kelly_agent = next((a for a in agents if a["id"] in ("kelly", "kelly-claude")), None)
        if kelly_agent:
            kelly_total = 0
            kelly_sources = {}

            # Stripe
            try:
                stripe_data = fetch_json("https://iamkelly.ai/api/stripe")
                stripe_rev = stripe_data.get("lifetime", 0)
                kelly_total += stripe_rev
                kelly_sources["stripe"] = stripe_rev
                print(f"    Kelly Stripe: ${stripe_rev:,.0f}")
            except Exception as e:
                print(f"    Kelly Stripe error: {e}")

            # Gumroad
            try:
                gumroad_data = fetch_json("https://iamkelly.ai/api/gumroad")
                gumroad_rev = gumroad_data.get("revenue", 0)
                kelly_total += gumroad_rev
                kelly_sources["gumroad"] = round(gumroad_rev, 2)
                print(f"    Kelly Gumroad: ${gumroad_rev:,.2f} ({gumroad_data.get('downloads', 0)} downloads)")
            except Exception as e:
                print(f"    Kelly Gumroad error: {e}")

            # App Store Connect
            try:
                asc_data = fetch_json("https://iamkelly.ai/api/asc")
                asc_rev_30d = asc_data.get("ascRevenue30d", 0)
                # ASC only gives 30-day, so add it as-is (this is a floor)
                kelly_total += asc_rev_30d
                kelly_sources["appStore30d"] = asc_rev_30d
                print(f"    Kelly App Store (30d): ${asc_rev_30d:,.2f}")
            except Exception as e:
                print(f"    Kelly App Store error: {e}")

            kelly_total = round(kelly_total)
            old_rev = kelly_agent.get("productRevenue") or 0
            if kelly_total > old_rev:
                kelly_agent["productRevenue"] = kelly_total
                kelly_agent["totalRevenue"] = kelly_total
                kelly_agent["revenueConfidence"] = "high"
                kelly_agent["revenueSources"] = kelly_sources
                updated = True
                print(f"    Kelly total: ${kelly_total:,} (was ${old_rev:,})")
    except Exception as e:
        print(f"    Kelly dashboard error: {e}")

    # --- Twitter revenue check ---
    print("\n  📊 Checking Twitter for revenue updates...")
    bearer = None
    try:
        bearer = get_twitter_bearer()
        findings = check_twitter_revenue(agents, bearer) or []
        if findings:
            save_revenue_findings(findings)
            applied = auto_apply_revenue(agents, findings)
            if applied:
                updated = True
                print(f"\n  ⚡ {len(applied)} revenue update(s) auto-applied to agents.json")
            else:
                print(f"\n  📋 {len(findings)} revenue tweet(s) logged (none auto-applied)")
        else:
            print("    No new revenue tweets")
    except Exception as e:
        print(f"    Twitter check failed: {e}")

    # --- Activity monitoring ---
    print("\n  📌 Checking Twitter for notable activity...")
    try:
        if not bearer:
            bearer = get_twitter_bearer()
        activity_count = check_twitter_activity(agents, bearer)
        if activity_count:
            updated = True
            print(f"\n  ⚡ {activity_count} activity update(s) added to feeds")
        else:
            print("    No new notable activity")
    except Exception as e:
        print(f"    Activity check failed: {e}")

    # --- Product launch detection ---
    try:
        if not bearer:
            bearer = get_twitter_bearer()
        launch_count = check_product_launches(agents, bearer)
        if launch_count:
            updated = True
            print(f"\n  📦 {launch_count} product(s) marked as shipped")
    except Exception as e:
        print(f"    Product launch check failed: {e}")

    # --- Market cap updates ---
    updated = False

    # --- Clanker trading fee revenue ---
    try:
        if fetch_clanker_fees(agents):
            updated = True
    except Exception as e:
        print(f"    Clanker fee check failed: {e}")

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
