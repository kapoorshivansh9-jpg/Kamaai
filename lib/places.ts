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

/**
 * Best clusters for a window: more relevant places is better, closer is better,
 * and rider votes move it up or down. A cluster needs at least 3 relevant places.
 *   score = count / (1 + distance_km / 1.5) + 2 × (busy − quiet votes)
 * The areas shown are spaced at least 400 m apart so the three picks differ.
 */
export function rankClusters(clusters: Cluster[], prof: string, windowId: string, limit = 3): RankedCluster[] {
  const ranked = clusters
    .map((cluster) => {
      const count = windowCount(cluster, prof, windowId);
      return { cluster, count, score: count / (1 + cluster.distKm / 1.5) + 2 * (cluster.busy - cluster.quiet) };
    })
    .filter((r) => r.count >= 3)
    .sort((a, b) => b.score - a.score || a.cluster.distKm - b.cluster.distKm);
  const out: RankedCluster[] = [];
  for (const r of ranked) {
    if (out.every((o) => approxKm(o.cluster, r.cluster) > 0.4)) out.push(r);
    if (out.length >= limit) break;
  }
  return out;
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

/**
 * Up to `limit` named places for a window: nearest first, a known/notable place
 * counts as 0.5 km closer, and no more than 3 of one kind so the list has variety.
 * Food riders get clusters instead, so this returns nothing for them.
 */
export function placesForWindow(prof: string, windowId: string, spots: PlaceSpot[], limit = 5): PlaceSpot[] {
  const kinds = PLACE_WINDOW_KINDS[prof]?.[windowId];
  if (!kinds) return [];
  const perKind: Record<string, number> = {};
  const out: PlaceSpot[] = [];
  const sorted = spots
    .filter((s) => kinds.includes(s.kind))
    .sort((a, b) => (a.distKm - (a.notable ? 0.5 : 0)) - (b.distKm - (b.notable ? 0.5 : 0)));
  for (const s of sorted) {
    if ((perKind[s.kind] ?? 0) >= (kinds.length === 1 ? limit : 3)) continue;
    perKind[s.kind] = (perKind[s.kind] ?? 0) + 1;
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}
