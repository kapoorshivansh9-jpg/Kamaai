// Shared types + pure helpers for the database-backed place recommendations.
// The data lives in Supabase (see places-schema.sql): `places` holds Delhi-NCR
// places from OpenStreetMap / Overture, and `hotspot_clusters` groups food and
// nightlife places that sit together into one named, pinned spot with a count.
// /api/hotspots reads them; the Shifts tab ranks them per time window here.

/** A group of places within a short walk of each other — one spot to wait at. */
export interface Cluster {
  key: string;            // also the id riders vote on
  name: string;
  lat: number;
  lon: number;
  distKm: number;
  placeCount: number;
  radiusM: number;
  kinds: Record<string, number>; // database kinds → how many of each
  topPlaces: string[];
  societiesNearby: number;       // named housing societies within 1.5 km
  busy: number;                  // rider votes, last 21 days
  quiet: number;
  grp: "food" | "nightlife";
}

/** One named place (metro station, mall, society, …). `kind` is the display label. */
export interface PlaceSpot {
  name: string;
  kind: string;
  lat: number;
  lon: number;
  distKm: number;
  notable?: boolean;
}

/** Database kind → the short label the Shifts tab shows and filters on. */
export const KIND_LABEL: Record<string, string> = {
  restaurant: "Restaurant", fast_food: "Fast food", cafe: "Café", bakery: "Bakery", sweets: "Sweets",
  ice_cream: "Ice cream", food_court: "Food court", nightlife: "Nightlife", grocery: "Grocery",
  market: "Market", mall: "Mall", metro: "Metro", rail: "Rail station", bus_stand: "Bus stand",
  airport: "Airport", hotel: "Hotel", hospital: "Hospital", college: "College", office: "Offices",
  society: "Society",
};

/** Which single-place kinds each kind of work needs from the database. */
export const PROF_PLACE_KINDS: Record<string, string[]> = {
  food:   ["society", "mall", "market", "metro", "office"],
  qcom:   ["society", "market", "mall", "metro"],
  cab:    ["mall", "hotel", "airport", "hospital", "office", "metro", "rail", "market", "society"],
  auto:   ["metro", "rail", "bus_stand", "market", "mall", "hospital", "college", "office", "society"],
  biketx: ["metro", "rail", "bus_stand", "market", "mall", "hospital", "college", "office", "society"],
};

/** Which cluster groups each kind of work uses. */
export const PROF_CLUSTER_GROUPS: Record<string, Cluster["grp"][]> = {
  food: ["food"], qcom: [], cab: ["nightlife"], auto: [], biketx: [],
};

// Per window: which members of a food cluster are actually open and busy then.
// A cluster only counts the places that matter for that time of day, so the
// breakfast pick and the dinner pick can be different spots.
const FOOD_WINDOW_KINDS: Record<string, string[]> = {
  breakfast: ["cafe", "bakery", "fast_food", "sweets"],
  "mid-morning": ["cafe", "bakery", "fast_food", "sweets"],
  lunch: ["restaurant", "fast_food", "food_court"],
  afternoon: ["cafe", "ice_cream", "bakery", "sweets", "fast_food"],
  dinner: ["restaurant", "fast_food", "food_court"],
  late: ["fast_food", "restaurant", "ice_cream"],
};
// Cab windows where bars and clubs produce rides.
const CAB_NIGHT_WINDOWS = new Set(["pre-evening", "office-pm", "night"]);

/** How many of a cluster's places matter in this window (0 = don't show it). */
export function windowCount(c: Cluster, prof: string, windowId: string): number {
  if (c.grp === "nightlife") return prof === "cab" && CAB_NIGHT_WINDOWS.has(windowId) ? c.placeCount : 0;
  if (prof !== "food") return 0;
  const kinds = FOOD_WINDOW_KINDS[windowId];
  if (!kinds) return c.placeCount;
  return kinds.reduce((n, k) => n + (c.kinds[k] ?? 0), 0);
}

export interface RankedCluster { cluster: Cluster; count: number; score: number }

// How far a rider is asked to look. Areas across this whole radius compete; a
// strong area 6 km away can beat a weak one next door.
export const SEARCH_RADIUS_KM = 10;
// Distance costs a rider time and fuel, but gently: an area 6 km away keeps
// half its score. (Quick-commerce is different — see QCOM_DIST_KM.)
const DIST_HALF_KM = 6;
// Quick-commerce drops are short hops from the rider's own store.
const QCOM_DIST_KM = 1.5;
// Picks shown together must be at least this far apart, so they are different
// areas and not three corners of one market.
const MIN_GAP_KM = 1.0;
// Each time an area has already been suggested earlier in the day, its score is
// multiplied by this, so later windows move on to other areas.
const REPEAT_PENALTY = 0.45;

// Home orders matter more at these times, so housing near a cluster counts.
const HOME_ORDER_WINDOWS = new Set(["breakfast", "dinner", "late"]);

/** Deterministic number in [0, 1) from a string — same input, same output. */
function hash01(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
/**
 * A small nudge (±12%) that differs by rider, by day and by window. Without it
 * every rider is sent to the same top spot every day; with it, close contenders
 * take turns and riders spread out. Clear winners still win.
 */
function rotation(seed: string, key: string): number {
  return 0.88 + 0.24 * hash01(`${seed}|${key}`);
}

export interface WindowPlan { ranked: RankedCluster[]; places: PlaceSpot[] }

/**
 * Plan the whole day in one pass so the windows don't repeat each other.
 *
 * Clusters (food, nightlife):
 *   score = relevant places × home-order boost ÷ (1 + km ÷ 6) + 2 × (busy − quiet votes)
 * Single places (metro, mall, hospital, …):
 *   score = (1 + notable + 0.3 × other useful places within 800 m, max 6) ÷ (1 + km ÷ 6)
 * Both are then multiplied by the rotation nudge and by 0.45 for every earlier
 * window that already suggested the same area. Picks in one window are at
 * least 1 km apart. `seed` should change per rider and per day.
 */
export function planDay(windowIds: string[], prof: string, clusters: Cluster[], spots: PlaceSpot[], seed: string): Record<string, WindowPlan> {
  const used = new Map<string, number>();
  const penalty = (key: string) => Math.pow(REPEAT_PENALTY, used.get(key) ?? 0);
  const mark = (key: string) => used.set(key, (used.get(key) ?? 0) + 1);
  const half = prof === "qcom" ? QCOM_DIST_KM : DIST_HALF_KM;
  const plan: Record<string, WindowPlan> = {};

  // How built-up the surroundings of a place are, from the other places we know.
  const neighbours = new Map<PlaceSpot, number>();
  for (const s of spots) {
    let n = 0;
    for (const o of spots) if (o !== s && approxKm(s, o) <= 0.8) n++;
    neighbours.set(s, Math.min(n, 6));
  }

  for (const windowId of windowIds) {
    // ── clusters ──
    const rankedAll = clusters
      .map((cluster) => {
        const count = windowCount(cluster, prof, windowId);
        const boost = cluster.grp === "food" && HOME_ORDER_WINDOWS.has(windowId) ? 1 + Math.min(cluster.societiesNearby, 30) / 60 : 1;
        const base = (count * boost) / (1 + cluster.distKm / half) + 2 * (cluster.busy - cluster.quiet);
        return { cluster, count, score: base * rotation(seed, `${windowId}|${cluster.key}`) * penalty(cluster.key) };
      })
      .filter((r) => r.count >= 3)
      .sort((a, b) => b.score - a.score || a.cluster.distKm - b.cluster.distKm);
    const ranked: RankedCluster[] = [];
    for (const r of rankedAll) {
      if (ranked.every((o) => approxKm(o.cluster, r.cluster) >= MIN_GAP_KM)) ranked.push(r);
      if (ranked.length >= 3) break;
    }
    ranked.forEach((r) => mark(r.cluster.key));

    // ── single places ──
    const kinds = PLACE_WINDOW_KINDS[prof]?.[windowId];
    const places: PlaceSpot[] = [];
    if (kinds) {
      const perKind: Record<string, number> = {};
      const maxPerKind = kinds.length === 1 ? 4 : 2;
      const gap = prof === "qcom" ? 0.3 : MIN_GAP_KM;
      const sorted = spots
        .filter((s) => kinds.includes(s.kind))
        .map((s) => {
          const key = `p:${s.kind}:${s.name}`;
          const base = (1 + (s.notable ? 1 : 0) + 0.3 * (neighbours.get(s) ?? 0)) / (1 + s.distKm / half);
          return { s, key, score: base * rotation(seed, `${windowId}|${key}`) * penalty(key) };
        })
        .sort((a, b) => b.score - a.score || a.s.distKm - b.s.distKm);
      for (const c of sorted) {
        if ((perKind[c.s.kind] ?? 0) >= maxPerKind) continue;
        if (!places.every((o) => approxKm(o, c.s) >= gap)) continue;
        perKind[c.s.kind] = (perKind[c.s.kind] ?? 0) + 1;
        places.push(c.s);
        mark(c.key);
        if (places.length >= 4) break;
      }
    }
    plan[windowId] = { ranked, places };
  }
  return plan;
}

function approxKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = (a.lat - b.lat) * 111;
  const dLon = (a.lon - b.lon) * 111 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}

/** Names that replace the hand-written landmarks in the playbook text. */
export interface LocalLandmarks { metro?: string; market?: string; office?: string; food?: string; nightlife?: string; mall?: string; residential?: string }

/**
 * Turn the nearest real places into the names the playbook sentences use, so
 * "wait near {residential}" becomes two actual societies instead of a range of
 * sectors. Anything we have no nearby place for is left to the old fallback.
 */
export function localLandmarks(clusters: Cluster[], spots: PlaceSpot[], maxKm = 5): LocalLandmarks {
  const nearest = (label: string, n = 1) =>
    spots.filter((s) => s.kind === label && s.distKm <= maxKm).sort((a, b) => a.distKm - b.distKm).slice(0, n).map((s) => s.name);
  const join = (names: string[]) => (names.length ? names.join(" & ") : undefined);
  const best = (grp: Cluster["grp"]) =>
    clusters.filter((c) => c.grp === grp && c.distKm <= maxKm)
      .sort((a, b) => b.placeCount / (1 + b.distKm / 1.5) - a.placeCount / (1 + a.distKm / 1.5))[0]?.name;
  const metro = nearest("Metro")[0];
  return {
    metro: metro ? (/metro|station/i.test(metro) ? metro : `${metro} Metro`) : undefined,
    market: nearest("Market")[0] ?? nearest("Mall")[0],
    mall: nearest("Mall")[0],
    office: nearest("Offices")[0],
    residential: join(nearest("Society", 2)),
    food: best("food"),
    nightlife: best("nightlife"),
  };
}

// Which single places are worth heading to in each window, by display label.
// Autos and bike taxis work the same rhythm, so they share a table.
const FEEDER: Record<string, string[]> = {
  "morning-feeder": ["Metro", "Rail station", "Bus stand"], morning: ["Metro", "Rail station", "Bus stand"],
  "mid-morning": ["Market", "Hospital", "College", "Metro"], midday: ["Market", "Mall", "Hospital"],
  afternoon: ["Market", "Mall", "College", "Hospital"],
  "evening-feeder": ["Metro", "Rail station", "Offices", "Bus stand"], evening: ["Metro", "Rail station", "Offices", "Bus stand"],
  night: ["Metro", "Market", "Mall"],
};
const PLACE_WINDOW_KINDS: Record<string, Record<string, string[]>> = {
  auto: FEEDER,
  biketx: FEEDER,
  cab: {
    "airport-early": ["Airport", "Hotel", "Rail station"], "office-am": ["Offices", "Hotel", "Metro"],
    "mid-morning": ["Mall", "Hospital", "Hotel"], midday: ["Mall", "Hospital", "Hotel"],
    "pre-evening": ["Mall", "Offices"], "office-pm": ["Offices", "Mall", "Metro"], night: ["Hotel", "Mall"],
  },
  // Quick-commerce riders wait at their own store; societies are where the orders go.
  qcom: { "morning-grocery": ["Society"], midday: ["Society"], "pre-evening": ["Society"], evening: ["Society"], late: ["Society"] },
};
