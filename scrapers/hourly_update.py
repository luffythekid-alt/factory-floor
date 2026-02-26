#!/usr/bin/env python3
"""
Factory Floor — Hourly data updater
Pulls market caps from DEXScreener, stores historical snapshots,
and updates agents.json with latest data + growth rates.
"""

import json
import os
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
AGENTS_JSON = BASE_DIR / "src" / "data" / "agents.json"
HISTORY_DIR = BASE_DIR / "data" / "history"
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
