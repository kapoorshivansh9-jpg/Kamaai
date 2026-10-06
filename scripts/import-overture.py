#!/usr/bin/env python3
"""Load Overture Maps places for Delhi NCR into the Supabase `places` table.

Overture Places (https://docs.overturemaps.org/guides/places) is free, may be
stored, and is much denser than OpenStreetMap for Indian restaurants and shops
because most of it comes from Meta and Microsoft. Each place carries a 0-1
`confidence` score; the app only uses rows scoring 0.75 or more.

Run by .github/workflows/import-overture.yml, or by hand:

    pip install overturemaps
    overturemaps download --bbox=76.92,28.38,77.56,28.90 -f geojsonseq --type=place -o places.geojsonl
    SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \\
        python scripts/import-overture.py places.geojsonl

Add --dry-run to see what would be loaded (and which categories are being
skipped) without writing anything. Only the Python standard library is used.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from collections import Counter

MIN_CONFIDENCE = 0.5   # stored; the app's own cut-off is 0.75
BATCH = 500

# Overture category -> our `kind`. Checked in order; the first match wins.
EXACT = {
    "cafe": "cafe", "coffee_shop": "cafe", "tea_room": "cafe", "bubble_tea": "cafe",
    "bakery": "bakery", "ice_cream_shop": "ice_cream", "frozen_yogurt_shop": "ice_cream", "desserts": "ice_cream",
    "candy_store": "sweets", "indian_sweets_shop": "sweets", "food_court": "food_court",
    "bar": "nightlife", "pub": "nightlife", "lounge": "nightlife", "cocktail_bar": "nightlife", "sports_bar": "nightlife",
    "dance_club": "nightlife", "night_club": "nightlife", "brewery": "nightlife", "beer_bar": "nightlife", "hookah_bar": "nightlife",
    "shopping_mall": "mall", "shopping_center": "mall",
    "supermarket": "grocery", "grocery_store": "grocery", "convenience_store": "grocery",
    "market": "market", "farmers_market": "market", "public_market": "market",
    "hotel": "hotel", "resort": "hotel", "hospital": "hospital",
    "college_university": "college", "university": "college", "college": "college",
    "apartments": "society", "condominium": "society", "housing_cooperative": "society", "gated_community": "society",
    "metro_station": "metro", "train_station": "rail", "bus_station": "bus_stand",
    "airport": "airport", "airport_terminal": "airport",
    "diner": "restaurant", "bistro": "restaurant", "buffet": "restaurant", "food": "restaurant",
}
FAST_FOOD_WORDS = ("fast_food", "burger", "pizza", "sandwich", "food_truck", "food_stand", "street_vendor", "chicken_wings", "hot_dog", "momo", "donut")


def kind_for(category):
    if not category:
        return None
    c = category.lower()
    if c in EXACT:
        return EXACT[c]
    if any(w in c for w in FAST_FOOD_WORDS):
        return "fast_food"
    if c.endswith("restaurant") or c.endswith("_cuisine"):
        return "restaurant"
    return None


def primary(obj, *path):
    """Walk nested dicts safely: primary(props, 'names', 'primary')."""
    for key in path:
        if not isinstance(obj, dict):
            return None
        obj = obj.get(key)
    return obj


def category_of(props):
    # The schema has moved over releases: categories.primary, then basic_category / taxonomy.
    for cand in (primary(props, "categories", "primary"), props.get("basic_category"), primary(props, "taxonomy", "primary")):
        if isinstance(cand, str) and cand:
            return cand
    return None


def row_for(feature):
    """One GeoJSON feature -> a `places` row, or (None, reason)."""
    props = feature.get("properties") or {}
    geom = feature.get("geometry") or {}
    coords = geom.get("coordinates")
    if geom.get("type") != "Point" or not isinstance(coords, list) or len(coords) < 2:
        return None, "no point"
    lon, lat = coords[0], coords[1]
    if not (isinstance(lat, (int, float)) and isinstance(lon, (int, float))):
        return None, "no point"
    name = primary(props, "names", "primary")
    if not isinstance(name, str) or not name.strip():
        return None, "no name"
    status = props.get("operating_status")
    if isinstance(status, str) and "closed" in status:
        return None, "closed"
    conf = props.get("confidence")
    if not isinstance(conf, (int, float)) or conf < MIN_CONFIDENCE:
        return None, "low confidence"
    category = category_of(props)
    kind = kind_for(category)
    if not kind:
        return None, "category:" + str(category)
    pid = props.get("id") or feature.get("id")
    if not pid:
        return None, "no id"
    brand = primary(props, "brand", "names", "primary")
    return {
        "source": "overture", "source_id": str(pid), "name": name.strip()[:120], "kind": kind,
        "lat": round(float(lat), 6), "lon": round(float(lon), 6),
        "brand": brand if isinstance(brand, str) and brand else None,
        "notable": bool(brand), "confidence": round(float(conf), 3),
    }, None


def post(url, key, path, payload, prefer=None):
    req = urllib.request.Request(url.rstrip("/") + path, data=json.dumps(payload).encode(), method="POST")
    req.add_header("apikey", key)
    req.add_header("Authorization", "Bearer " + key)
    req.add_header("Content-Type", "application/json")
    if prefer:
        req.add_header("Prefer", prefer)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.status, resp.read().decode()[:300]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]


def main(argv):
    dry = "--dry-run" in argv
    files = [a for a in argv[1:] if not a.startswith("--")]
    if len(files) != 1:
        print(__doc__)
        return 2
    rows, skipped, kinds = {}, Counter(), Counter()
    with open(files[0], encoding="utf-8") as fh:
        for line in fh:
            line = line.strip().lstrip("\x1e")  # GeoJSON-seq records may start with a record separator
            if not line:
                continue
            try:
                feature = json.loads(line)
            except json.JSONDecodeError:
                skipped["bad json"] += 1
                continue
            row, why = row_for(feature)
            if row:
                rows[row["source_id"]] = row
                kinds[row["kind"]] += 1
            else:
                skipped[why] += 1
    print(f"{len(rows)} places to load: " + ", ".join(f"{k} {n}" for k, n in kinds.most_common()))
    reasons = Counter({k: v for k, v in skipped.items() if not k.startswith("category:")})
    print("skipped: " + ", ".join(f"{k} {n}" for k, n in reasons.most_common()))
    unmapped = Counter({k[9:]: v for k, v in skipped.items() if k.startswith("category:")})
    print(f"skipped {sum(unmapped.values())} places in categories we do not use; the most common: "
          + ", ".join(f"{k} {n}" for k, n in unmapped.most_common(25)))
    if dry:
        return 0
    if not rows:
        print("Nothing to load. Refusing to continue so an empty download is noticed.")
        return 1

    url, key = os.environ.get("SUPABASE_URL", ""), os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url.startswith("http") or not key:
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (the service-role key, not the anon key).")
        return 2
    batch, done = list(rows.values()), 0
    for i in range(0, len(batch), BATCH):
        status, text = post(url, key, "/rest/v1/places?on_conflict=source,source_id", batch[i:i + BATCH],
                            prefer="resolution=merge-duplicates,return=minimal")
        if status >= 300:
            print(f"Upload failed at row {i}: HTTP {status} {text}")
            return 1
        done += len(batch[i:i + BATCH])
    print(f"Uploaded {done} places.")
    status, text = post(url, key, "/rest/v1/rpc/rk_rebuild_clusters", {})
    print(f"Rebuilt clusters: HTTP {status} {text}")
    return 0 if status < 300 else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
