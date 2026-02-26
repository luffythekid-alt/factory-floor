#!/usr/bin/env python3
"""
Backfill historical market cap data from CoinGecko and store as snapshots.
"""

import json
import os
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
HISTORY_DIR = BASE_DIR / "data" / "history"
HISTORY_DIR.mkdir(parents=True, exist_ok=True)

# CoinGecko IDs (only tokens that are listed there)
COINGECKO_IDS = {
    "antihunter": "antihunter",
    "kelly": "kellyclaude",
    # felix and juno are wrong tokens on CoinGecko, skip
}

# For tokens not on CoinGecko, try to get what we can from other sources
# We'll use DEXScreener pair creation date + current data as minimum

def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "FactoryFloor/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

def backfill_from_coingecko(agent_id, cg_id, days=90):
    """Pull historical daily market cap from CoinGecko."""
    print(f"\n  [{agent_id}] Fetching {days} days from CoinGecko ({cg_id})...")
    try:
        data = fetch_json(
            f"https://api.coingecko.com/api/v3/coins/{cg_id}/market_chart"
            f"?vs_currency=usd&days={days}&interval=daily"
        )
    except Exception as e:
        print(f"    Error: {e}")
        return []
    
    snapshots = []
    market_caps = data.get("market_caps", [])
    prices = data.get("prices", [])
    volumes = data.get("total_volumes", [])
    
    # Build price/volume lookup by timestamp
    price_map = {int(p[0]): p[1] for p in prices}
    vol_map = {int(v[0]): v[1] for v in volumes}
    
    for mc in market_caps:
        ts_ms = int(mc[0])
        ts = ts_ms // 1000
        mcap = mc[1]
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        
        # Find closest price and volume
        price = price_map.get(ts_ms, 0)
        volume = vol_map.get(ts_ms, 0)
        
        snapshot = {
            "timestamp": ts,
            "datetime": dt.isoformat(),
            "marketCap": round(mcap) if mcap else None,
            "price": price,
            "volume24h": volume,
            "liquidity": None,
            "priceChange24h": None,
            "totalRevenue": None,
            "source": "coingecko_backfill",
        }
        snapshots.append(snapshot)
    
    print(f"    Got {len(snapshots)} daily snapshots")
    if snapshots:
        first = snapshots[0]["datetime"][:10]
        last = snapshots[-1]["datetime"][:10]
        print(f"    Range: {first} to {last}")
    
    return snapshots

def merge_snapshots(existing, new_snapshots):
    """Merge new snapshots into existing, avoiding duplicates by timestamp."""
    existing_ts = {s["timestamp"] for s in existing}
    merged = list(existing)
    added = 0
    for s in new_snapshots:
        if s["timestamp"] not in existing_ts:
            merged.append(s)
            added += 1
    merged.sort(key=lambda s: s["timestamp"])
    return merged, added

def run():
    print("Factory Floor — Backfill historical data")
    print("=" * 50)
    
    for agent_id, cg_id in COINGECKO_IDS.items():
        snapshots = backfill_from_coingecko(agent_id, cg_id, days=90)
        
        if not snapshots:
            continue
        
        # Load existing history
        history = {"snapshots": []}
        path = HISTORY_DIR / f"{agent_id}.json"
        if path.exists():
            with open(path) as f:
                history = json.load(f)
        
        # Merge
        merged, added = merge_snapshots(history["snapshots"], snapshots)
        history["snapshots"] = merged
        
        with open(path, "w") as f:
            json.dump(history, f, indent=2)
        
        print(f"    Added {added} new snapshots (total: {len(merged)})")
        
        # Rate limit for CoinGecko free tier
        time.sleep(1.5)
    
    # For felix and juno, we don't have CoinGecko history
    # but we can note when their pairs were created
    print("\n  [felix] No CoinGecko history (wrong token listed)")
    print("    Pair created: 2026-02-03 (from DEXScreener)")
    print("    Backfill limited to hourly going forward")
    
    print("\n  [juno] No CoinGecko history (wrong token listed)")  
    print("    Backfill limited to hourly going forward")
    
    print("\n✓ Backfill complete")

if __name__ == "__main__":
    run()
