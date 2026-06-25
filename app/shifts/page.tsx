"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, AlertTriangle, TrendingUp, Clock, Target, Zap, Navigation, Lightbulb, ChevronDown } from "lucide-react";
import { useProfile } from "@/lib/ridekamao-profile";
import { windowsFor, detectZone, isWindowActive } from "@/lib/ridekamao-data";
import { trackEvent, submitSpotFeedback, fetchZoneStats, type ZoneStat } from "@/lib/supabase-events";
import { useT, useLang, profTitle, localeTag } from "@/lib/i18n";
import type { ShiftWindow, Zone, Hotspot } from "@/lib/ridekamao-data";

const G = {
  green: "#0A9060", green700: "#045234", green600: "#066B47", green50: "#D8F5E8", green100: "#B4EAD0",
  ink: "#05160E", ink2: "#163022", muted: "#456055", faint: "#7A9A8A",
  line: "#BDD8C8", line2: "#DDF0E6", surface: "#FFFFFF", bg: "#EBF7F1",
  amber: "#C96E00", amberBg: "#FFF0D4", amberInk: "#7A3E00",
  red: "#B83030", redBg: "#FCEAEA", redInk: "#6B1818",
};

const TAG = {
  surge:  { bg: G.amberBg, ink: G.amberInk, bar: `linear-gradient(90deg,${G.amber},#A04A00)`, border: G.amber },
  cool:   { bg: "#E0EAFF", ink: "#0C2A7A",   bar: "linear-gradient(90deg,#1A4FCC,#0C2A7A)",  border: "#1A4FCC" },
  steady: { bg: G.green50, ink: G.green700,  bar: `linear-gradient(90deg,${G.green},${G.green600})`, border: G.green },
  avoid:  { bg: G.redBg,   ink: G.redInk,    bar: `linear-gradient(90deg,${G.red},#7A0000)`,  border: G.red },
};

const RISK_COLORS = ["#1E9C47", "#D97B00", "#D45C00", "#C93B35"];

function NowBadge() {
  const t = useT();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", borderRadius: 100, background: G.green, color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: ".6px", boxShadow: "0 4px 10px -3px rgba(10,144,96,.55)" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#9BF0CE", display: "inline-block", animation: "rk-pulse 1.4s infinite" }} />
      {t("shifts.now")}
    </span>
  );
}

const HEAT_CHIP: Record<"peak" | "high" | "good", { bg: string; ink: string; key: "d.peak" | "d.high" | "d.good" }> = {
  peak: { bg: G.amberBg, ink: G.amberInk, key: "d.peak" },
  high: { bg: G.green50, ink: G.green700, key: "d.high" },
  good: { bg: "#E6EEFF", ink: "#0C2A7A", key: "d.good" },
};

type Spot = { name: string; kind: string; lat: number; lon: number; distKm: number };
type Area = { name: string; distKm: number; spots: Spot[] };
const dirUrl = (lat: number, lon: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
const searchUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

// Which OSM spot kinds matter for each window, so every time slot shows DIFFERENT,
// time-appropriate places (breakfast → cafés/bakeries; lunch → restaurants; etc.).
const WINDOW_KINDS: Record<string, Record<string, string[]>> = {
  food: { breakfast: ["Café", "Bakery", "Fast food"], "mid-morning": ["Café", "Bakery", "Fast food"], lunch: ["Restaurant", "Fast food"], afternoon: ["Café", "Ice cream", "Bakery"], dinner: ["Restaurant", "Fast food"], late: ["Fast food", "Grocery"] },
  qcom: { "morning-grocery": ["Grocery", "Market"], midday: ["Grocery"], "pre-evening": ["Grocery", "Market"], evening: ["Grocery", "Market"], late: ["Grocery"] },
  cab: { "airport-early": ["Hotel"], "office-am": ["Mall", "Hotel"], "mid-morning": ["Mall", "Hotel"], midday: ["Mall", "Hotel"], "pre-evening": ["Mall", "Nightlife"], "office-pm": ["Mall", "Nightlife"], night: ["Nightlife", "Hotel"] },
  auto: { "morning-feeder": ["Metro", "Bus stand"], "mid-morning": ["Market", "Metro"], midday: ["Market", "Mall"], afternoon: ["Market", "Mall"], "evening-feeder": ["Metro", "Bus stand"], night: ["Market", "Metro"] },
  biketx: { morning: ["Metro", "Bus stand"], midday: ["Market", "Mall"], afternoon: ["Market", "Mall"], evening: ["Metro", "Bus stand"], night: ["Market", "Metro"] },
};
function spotsForWindow(prof: string, windowId: string, spots: Spot[]): Spot[] {
  const kinds = WINDOW_KINDS[prof]?.[windowId];
  if (!kinds) return spots;
  const matched = spots.filter((s) => kinds.includes(s.kind));
  return matched.length ? matched : spots; // keep differentiation when possible, else show what's near
}

// Sub-areas WITHIN each broad zone, so the plan names "Sector 18", not "Noida".
// Each is tagged with the activity it suits; we pick DIFFERENT ones per window
// (offices at lunch, homes at dinner, nightlife late) → time-optimised + local.
type Vibe = "office" | "residential" | "market" | "metro" | "nightlife" | "food";
type SubArea = { name: string; lat: number; lon: number; vibes: Vibe[] };
const SUBAREAS: Record<string, SubArea[]> = {
  cp: [
    { name: "Connaught Place (Inner Circle)", lat: 28.6328, lon: 77.2197, vibes: ["food", "market", "office", "nightlife", "metro"] },
    { name: "Barakhamba Road", lat: 28.6300, lon: 77.2250, vibes: ["office", "metro"] },
    { name: "Karol Bagh", lat: 28.6510, lon: 77.1900, vibes: ["market", "food", "residential"] },
    { name: "Paharganj / New Delhi Stn", lat: 28.6450, lon: 77.2120, vibes: ["metro", "food", "residential"] },
    { name: "Gole Market homes", lat: 28.6280, lon: 77.2010, vibes: ["residential"] },
    { name: "Khan Market", lat: 28.5995, lon: 77.2270, vibes: ["food", "market", "nightlife"] },
    { name: "Bengali Market", lat: 28.6290, lon: 77.2300, vibes: ["food", "market"] },
    { name: "Rajendra Place / Patel Nagar", lat: 28.6440, lon: 77.1810, vibes: ["office", "metro", "residential"] },
    { name: "Daryaganj / Chawri Bazaar", lat: 28.6480, lon: 77.2330, vibes: ["market", "food", "metro"] },
  ],
  noida: [
    { name: "Sector 18 (Atta Market)", lat: 28.5705, lon: 77.3210, vibes: ["market", "food", "nightlife", "metro"] },
    { name: "Sector 62 IT parks", lat: 28.6270, lon: 77.3640, vibes: ["office", "food"] },
    { name: "Sector 15/16 offices", lat: 28.5790, lon: 77.3120, vibes: ["office", "metro"] },
    { name: "Sector 50–78 societies", lat: 28.5760, lon: 77.3600, vibes: ["residential"] },
    { name: "Sector 137 / Expressway", lat: 28.4980, lon: 77.4090, vibes: ["office", "residential"] },
    { name: "Sector 104/105 societies", lat: 28.5560, lon: 77.3650, vibes: ["residential"] },
    { name: "Gardens Galleria & GIP malls", lat: 28.5680, lon: 77.3260, vibes: ["market", "food", "nightlife"] },
    { name: "Sector 32 City Centre", lat: 28.5740, lon: 77.3560, vibes: ["metro", "market"] },
    { name: "Film City (Sector 16A)", lat: 28.5810, lon: 77.3170, vibes: ["office"] },
    { name: "Sector 76–79 societies", lat: 28.5680, lon: 77.3850, vibes: ["residential"] },
    { name: "Sector 168 / Expressway", lat: 28.5230, lon: 77.4380, vibes: ["office", "residential"] },
    { name: "Greater Noida (Pari Chowk)", lat: 28.4670, lon: 77.5030, vibes: ["market", "residential", "food"] },
  ],
  gurgaon: [
    { name: "Cyber City / Cyber Hub", lat: 28.4940, lon: 77.0880, vibes: ["office", "food", "nightlife"] },
    { name: "Sector 29 (bars)", lat: 28.4660, lon: 77.0620, vibes: ["nightlife", "food", "market"] },
    { name: "DLF Phase 1–5", lat: 28.4720, lon: 77.0950, vibes: ["residential"] },
    { name: "MG Road / Sikanderpur", lat: 28.4790, lon: 77.0800, vibes: ["metro", "market", "nightlife"] },
    { name: "Sohna Road societies", lat: 28.4180, lon: 77.0370, vibes: ["residential", "food"] },
    { name: "Golf Course Road", lat: 28.4500, lon: 77.1020, vibes: ["office", "residential", "nightlife"] },
    { name: "Ambience Mall / NH-8", lat: 28.5040, lon: 77.0960, vibes: ["market", "food"] },
    { name: "Sushant Lok / Sector 56", lat: 28.4250, lon: 77.1010, vibes: ["residential", "market"] },
    { name: "Udyog Vihar", lat: 28.5020, lon: 77.0840, vibes: ["office"] },
    { name: "New Gurgaon (Sector 82–95)", lat: 28.4000, lon: 76.9700, vibes: ["residential"] },
    { name: "Rajiv Chowk / Sohna flyover", lat: 28.4430, lon: 77.0290, vibes: ["market", "metro"] },
  ],
  rohini: [
    { name: "Rohini Sector 3 Market", lat: 28.7150, lon: 77.1140, vibes: ["market", "food"] },
    { name: "Netaji Subhash Place", lat: 28.6960, lon: 77.1520, vibes: ["office", "metro", "food"] },
    { name: "Rohini West Metro", lat: 28.7140, lon: 77.1080, vibes: ["metro", "residential"] },
    { name: "Pitampura (TV Tower)", lat: 28.7030, lon: 77.1310, vibes: ["market", "residential"] },
    { name: "Sector 7–13 flats", lat: 28.7050, lon: 77.1000, vibes: ["residential"] },
    { name: "Unity One Mall (Sector 10)", lat: 28.7210, lon: 77.1130, vibes: ["market", "food", "nightlife"] },
    { name: "Prashant Vihar", lat: 28.7100, lon: 77.1230, vibes: ["residential", "food"] },
    { name: "Kohat Enclave metro", lat: 28.6980, lon: 77.1390, vibes: ["metro", "market"] },
    { name: "Mangolpuri / Sultanpuri", lat: 28.6900, lon: 77.0700, vibes: ["residential", "market"] },
  ],
  dwarka: [
    { name: "Sector 6 Market", lat: 28.5920, lon: 77.0460, vibes: ["market", "food"] },
    { name: "Vegas Mall (Sector 14)", lat: 28.5980, lon: 77.0590, vibes: ["market", "food", "nightlife"] },
    { name: "Dwarka Sector 21 Metro", lat: 28.5520, lon: 77.0580, vibes: ["metro"] },
    { name: "Sector 10–14 societies", lat: 28.5870, lon: 77.0550, vibes: ["residential"] },
    { name: "Dwarka Expressway offices", lat: 28.5050, lon: 77.0610, vibes: ["office", "residential"] },
    { name: "Pacific Mall (Sector 23)", lat: 28.5780, lon: 77.0680, vibes: ["market", "food", "nightlife"] },
    { name: "Janakpuri District Centre", lat: 28.6290, lon: 77.0780, vibes: ["office", "market", "metro"] },
    { name: "Uttam Nagar", lat: 28.6210, lon: 77.0600, vibes: ["residential", "market"] },
    { name: "Sector 12 / Dwarka Mor", lat: 28.6190, lon: 77.0330, vibes: ["metro", "market", "residential"] },
  ],
  saket: [
    { name: "Select Citywalk / Saket", lat: 28.5280, lon: 77.2190, vibes: ["market", "food", "nightlife"] },
    { name: "Hauz Khas Village", lat: 28.5530, lon: 77.1940, vibes: ["nightlife", "food"] },
    { name: "Malviya Nagar", lat: 28.5350, lon: 77.2060, vibes: ["market", "food", "residential"] },
    { name: "Saket Metro / District Centre", lat: 28.5240, lon: 77.2050, vibes: ["metro", "office"] },
    { name: "Saidulajab homes", lat: 28.5160, lon: 77.1990, vibes: ["residential"] },
    { name: "Greater Kailash (M/N-block)", lat: 28.5480, lon: 77.2420, vibes: ["food", "market", "nightlife"] },
    { name: "Green Park market", lat: 28.5600, lon: 77.2060, vibes: ["food", "market", "metro"] },
    { name: "Vasant Kunj malls", lat: 28.5400, lon: 77.1590, vibes: ["market", "food", "residential"] },
    { name: "Mehrauli / Lado Sarai", lat: 28.5160, lon: 77.1820, vibes: ["food", "residential", "nightlife"] },
  ],
  lajpat: [
    { name: "Lajpat Nagar Central Market", lat: 28.5680, lon: 77.2430, vibes: ["market", "food"] },
    { name: "Nehru Place", lat: 28.5490, lon: 77.2510, vibes: ["office", "food", "market"] },
    { name: "Defence Colony", lat: 28.5730, lon: 77.2300, vibes: ["food", "nightlife", "residential"] },
    { name: "Lajpat Nagar Metro", lat: 28.5700, lon: 77.2360, vibes: ["metro"] },
    { name: "Nizamuddin homes", lat: 28.5910, lon: 77.2440, vibes: ["residential"] },
    { name: "Kalkaji / Govindpuri metro", lat: 28.5430, lon: 77.2580, vibes: ["metro", "market", "residential"] },
    { name: "Ashram / Sarai Kale Khan", lat: 28.5830, lon: 77.2570, vibes: ["metro", "office"] },
    { name: "Jangpura / Bhogal", lat: 28.5840, lon: 77.2450, vibes: ["food", "market", "residential"] },
    { name: "Greater Kailash I", lat: 28.5530, lon: 77.2350, vibes: ["food", "market", "nightlife"] },
  ],
};

// Which sub-area "vibes" each window wants — this is what makes the recommended
// areas change through the day.
const WINDOW_VIBES: Record<string, Record<string, Vibe[]>> = {
  food: { breakfast: ["food", "residential"], "mid-morning": ["food", "market"], lunch: ["office", "food"], afternoon: ["market", "food"], dinner: ["residential", "food", "nightlife"], late: ["nightlife", "food"] },
  qcom: { "morning-grocery": ["residential"], midday: ["residential"], "pre-evening": ["residential", "market"], evening: ["residential", "market"], late: ["residential", "nightlife"] },
  cab: { "airport-early": ["office", "residential"], "office-am": ["office"], "mid-morning": ["market", "office"], midday: ["market", "office"], "pre-evening": ["office", "market"], "office-pm": ["office", "nightlife"], night: ["nightlife"] },
  auto: { "morning-feeder": ["metro", "office"], "mid-morning": ["market", "metro"], midday: ["market"], afternoon: ["market", "metro"], "evening-feeder": ["metro", "residential"], night: ["market", "nightlife"] },
  biketx: { morning: ["metro", "office"], midday: ["market"], afternoon: ["market", "metro"], evening: ["metro", "office"], night: ["nightlife", "metro"] },
};

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371, dLat = ((bLat - aLat) * Math.PI) / 180, dLon = ((bLon - aLon) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** Nearest time-appropriate sub-areas to the rider (across all zones, ≤8 km). */
function subAreasFor(coords: { lat: number; lon: number } | null, prof: string, windowId: string): SubArea[] {
  if (!coords) return [];
  const vibes = WINDOW_VIBES[prof]?.[windowId] ?? [];
  const withD = Object.values(SUBAREAS).flat()
    .map((sa) => ({ sa, d: haversineKm(coords.lat, coords.lon, sa.lat, sa.lon) }))
    .filter((x) => x.d <= 8)
    .sort((a, b) => a.d - b.d);
  const matched = withD.filter((x) => x.sa.vibes.some((v) => vibes.includes(v)));
  return (matched.length >= 2 ? matched : withD).slice(0, 6).map((x) => x.sa);
}

function SpotRow({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 11px", borderRadius: 11, background: G.surface, border: `1px solid ${G.line}`, textDecoration: "none" }}>
      <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: G.green50, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MapPin size={14} color={G.green700} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: G.ink, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ fontSize: 11.5, color: G.muted, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
      </div>
      <Navigation size={15} color={G.green} style={{ flexShrink: 0 }} />
    </a>
  );
}

type Feedback = { stats: Record<string, ZoneStat> | null; voted: Set<string>; vote: (zone: string, windowId: string, busy: boolean) => void };

function ZoneRow({ zone, windowId, fb, distKm }: { zone: string; windowId: string; fb: Feedback; distKm?: number }) {
  const t = useT();
  const stat = fb.stats?.[zone];
  const votes = stat ? stat.busy + stat.quiet : 0;
  const voted = fb.voted.has(zone);
  const crowd = votes > 0
    ? `${stat!.score >= 0.6 ? "🔥 " + t("fb.usuallyBusy") : stat!.score <= 0.4 ? t("fb.oftenQuiet") : t("fb.mixed")} · ${votes}`
    : t("fb.q");
  const badge = distKm != null ? `${distKm} km · ${crowd}` : crowd;
  const voteBtn = (bg: string) => ({ width: 30, height: 30, borderRadius: 9, border: `1px solid ${G.line}`, background: bg, fontSize: 14, lineHeight: 1, cursor: "pointer", flexShrink: 0, display: "flex" as const, alignItems: "center", justifyContent: "center" });
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "9px 11px", borderRadius: 11, background: G.surface, border: `1px solid ${G.line}` }}>
      <a href={searchUrl(zone)} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 0, textDecoration: "none" }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: G.green50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MapPin size={14} color={G.green700} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: G.ink, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{zone}</div>
          <div style={{ fontSize: 11, color: votes > 0 && stat!.score >= 0.6 ? G.green700 : G.muted, marginTop: 2, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{badge}</div>
        </div>
      </a>
      {voted ? (
        <span style={{ fontSize: 11, fontWeight: 800, color: G.green700, flexShrink: 0 }}>✓ {t("fb.thanks")}</span>
      ) : (
        <>
          <button onClick={() => fb.vote(zone, windowId, true)} aria-label={t("fb.yes")} title={t("fb.yes")} style={voteBtn(G.green50)}>👍</button>
          <button onClick={() => fb.vote(zone, windowId, false)} aria-label={t("fb.no")} title={t("fb.no")} style={voteBtn(G.bg)}>👎</button>
        </>
      )}
    </div>
  );
}

function GroupLabel({ children }: { children: string }) {
  return <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".7px", textTransform: "uppercase", color: G.faint, marginBottom: 8 }}>{children}</div>;
}

// Curated spot with its busy "key" (peak/high/good) — used when we have no live data.
function HotspotRow({ h }: { h: Hotspot }) {
  const t = useT();
  const chip = HEAT_CHIP[h.heat];
  return (
    <a href={searchUrl(`${h.name}, Delhi NCR`)} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 11px", borderRadius: 11, background: G.surface, border: `1px solid ${G.line}`, textDecoration: "none" }}>
      <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: G.green50, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MapPin size={14} color={G.green700} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: G.ink, lineHeight: 1.25 }}>{h.name}</div>
        <div style={{ fontSize: 11.5, color: G.muted, marginTop: 2, lineHeight: 1.4 }}>{h.why}</div>
      </div>
      <span style={{ flexShrink: 0, padding: "2px 7px", borderRadius: 6, fontSize: 9.5, fontWeight: 800, letterSpacing: ".3px", textTransform: "uppercase", background: chip.bg, color: chip.ink }}>{t(chip.key)}</span>
    </a>
  );
}

// One real place nested under an area (compact row → Maps directions).
function NestedSpot({ s }: { s: Spot }) {
  return (
    <a href={dirUrl(s.lat, s.lon)} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", textDecoration: "none" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: G.green, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: G.ink2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
      <span style={{ fontSize: 11, color: G.faint, flexShrink: 0 }}>{s.kind} · {s.distKm}km</span>
      <Navigation size={13} color={G.green} style={{ flexShrink: 0 }} />
    </a>
  );
}

function DetailPanel({ d, reason, tag, areas, spots, windowId, fb, isMidday }: { d: ShiftWindow["detail"]; reason: string; tag: typeof TAG[keyof typeof TAG]; areas: Area[]; spots: Spot[]; windowId: string; fb: Feedback; isMidday: boolean }) {
  const t = useT();
  const flat = spots.slice(0, 5);
  return (
    <div style={{ padding: "14px 16px 16px", borderTop: `1px solid ${G.line2}`, background: `${tag.bg}40`, animation: "rk-fadeUp .25s both" }}>
      {/* Where to be */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", borderRadius: 12, background: G.green, marginBottom: 12 }}>
        <Target size={15} color="#fff" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".7px", textTransform: "uppercase", color: "rgba(255,255,255,.7)", marginBottom: 2 }}>{t("d.whereToBe")}</div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: "#fff", fontWeight: 600 }}>{d.position}</p>
        </div>
      </div>


      {/* Why now — the earning reason */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 14 }}>
        <Zap size={13} color={G.green700} style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: G.ink2 }}>{reason}</p>
      </div>

      {/* Heat advisory for the dangerous midday window */}
      {isMidday && (
        <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "10px 12px", borderRadius: 11, background: G.redBg, border: "1px solid rgba(201,59,53,.25)", marginBottom: 14 }}>
          <span style={{ fontSize: 15, lineHeight: 1 }}>🥵</span>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: G.redInk, fontWeight: 600 }}>{t("shifts.heatMidday")}</p>
        </div>
      )}

      {/* Places — grouped under nearby areas (≤5 km) when we have live data */}
      <GroupLabel>{areas.length > 0 ? t("d.areasNear") : t("d.bestSpots")}</GroupLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: areas.length > 0 ? 10 : 7, marginBottom: 14 }}>
        {areas.length > 0
          ? areas.map((a, i) => (
              <div key={i} style={{ border: `1px solid ${G.line}`, borderRadius: 12, overflow: "hidden", background: G.surface }}>
                <ZoneRow zone={a.name} distKm={a.distKm > 0 ? a.distKm : undefined} windowId={windowId} fb={fb} />
                <div style={{ borderTop: `1px solid ${G.line2}`, padding: "4px 11px 8px" }}>
                  {a.spots.map((s, j) => <NestedSpot key={j} s={s} />)}
                </div>
              </div>
            ))
          : flat.length > 0
            ? flat.map((s, i) => <SpotRow key={i} href={dirUrl(s.lat, s.lon)} title={s.name} sub={`${s.kind} · ${s.distKm} km`} />)
            : d.hotspots.map((h, i) => <HotspotRow key={i} h={h} />)}
      </div>

      {/* Money tip */}
      <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "10px 12px", borderRadius: 11, background: "rgba(245,197,66,.14)", border: "1px solid rgba(201,110,0,.22)" }}>
        <Lightbulb size={15} color={G.amber} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: G.amberInk, fontWeight: 600 }}>{d.tip}</p>
      </div>
    </div>
  );
}

function WindowCard({ w, idx, isAvoid, active, spots, areas, areaName, zoneId, coords, profId, fb }: { w: ShiftWindow; idx: number; isAvoid: boolean; active?: boolean; spots: Spot[]; areas: Area[]; areaName: string; zoneId: string | null; coords: { lat: number; lon: number } | null; profId: string; fb: Feedback }) {
  const [open, setOpen] = useState((idx === 0 || !!active) && !isAvoid);
  const tag = TAG[w.tag];
  const t = useT();
  const winSpots = spotsForWindow(profId, w.id, spots);
  const kinds = WINDOW_KINDS[profId]?.[w.id] ?? null;
  const matchKind = (s: Spot) => !kinds || kinds.includes(s.kind);

  // Curated sub-areas for THIS zone + window (change through the day), each with
  // the real nearby places (within ~4 km) nested inside. Only keep areas that
  // actually have specific spots, so the rider never sees a bare area name.
  let winAreas: { name: string; distKm: number; spots: Spot[] }[] = subAreasFor(coords, profId, w.id)
    .map((sa) => ({
      name: sa.name,
      distKm: coords ? Math.round(haversineKm(coords.lat, coords.lon, sa.lat, sa.lon) * 10) / 10 : 0,
      spots: coords
        ? spots.filter(matchKind)
            .map((s) => ({ s, d: haversineKm(sa.lat, sa.lon, s.lat, s.lon) }))
            .filter((x) => x.d <= 4).sort((a, b) => a.d - b.d).slice(0, 5).map((x) => x.s)
        : [],
    }))
    .filter((a) => a.spots.length > 0)
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 3);

  // Fallbacks: real OSM neighbourhoods (already have spots) → the rider's area.
  if (winAreas.length === 0) {
    winAreas = areas.map((a) => ({ name: a.name, distKm: a.distKm, spots: (kinds ? a.spots.filter(matchKind) : a.spots).slice(0, 5) })).filter((a) => a.spots.length > 0).slice(0, 3);
  }
  if (winAreas.length === 0 && winSpots.length > 0) {
    winAreas = [{ name: areaName, distKm: 0, spots: winSpots.slice(0, 5) }];
  }
  const isMidday = w.startH < 15 && w.endH > 12; // overlaps the 12–3 PM peak-heat window

  if (isAvoid) {
    return (
      <div style={{ background: G.redBg, borderRadius: 18, padding: "14px 16px", border: "1px solid rgba(201,59,53,.2)", display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: G.surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <AlertTriangle size={18} color={G.red} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: G.redInk, fontVariantNumeric: "tabular-nums" }}>{w.time}</span>
            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 700, background: G.red, color: "#fff" }}>{t("shifts.avoidBadge")}</span>
            {active && <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 700, background: G.surface, color: G.redInk }}>{t("shifts.rightNow")}</span>}
          </div>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: G.redInk }}>{w.reason}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: G.surface, borderRadius: 18, marginBottom: 10,
        border: `1px solid ${G.line}`,
        borderLeft: `3.5px solid ${tag.border}`,
        boxShadow: "0 2px 4px rgba(5,22,14,.05), 0 12px 28px -8px rgba(5,22,14,.15)",
        animation: `rk-fadeUp .4s ${idx * 0.06}s both`,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "15px 16px" }}
      >
        {/* Rank badge */}
        <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: idx === 0 ? G.green : G.green50, color: idx === 0 ? "#fff" : G.green700 }}>
          <span style={{ fontWeight: 800, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{idx + 1}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Time — big and bold */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: G.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-.4px", lineHeight: 1.1 }}>{w.time}</span>
            {active && <NowBadge />}
          </div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 3, fontWeight: 600 }}>{w.label}</div>
        </div>

        {/* Rate */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: G.green700, fontVariantNumeric: "tabular-nums", letterSpacing: "-.5px", lineHeight: 1 }}>₹{w.rphr}</div>
          <div style={{ fontSize: 10, color: G.faint, fontWeight: 700, marginTop: 3, textTransform: "uppercase", letterSpacing: ".4px" }}>{t("shifts.perHour")}</div>
        </div>

        <ChevronDown size={18} color={G.faint} style={{ flexShrink: 0, transition: "transform .25s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {/* Demand bar + tag + tap hint */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 12px" }}>
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: G.line2, overflow: "hidden" }}>
          <div style={{ width: `${w.demand * 100}%`, height: "100%", borderRadius: 3, background: tag.bar, transition: "width .8s cubic-bezier(.4,0,.2,1)" }} />
        </div>
        <span style={{ padding: "3px 9px", borderRadius: 7, fontSize: 10.5, fontWeight: 700, background: tag.bg, color: tag.ink, flexShrink: 0, letterSpacing: ".2px" }}>{w.tagText}</span>
      </div>

      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "9px 16px", background: "none", border: "none", borderTop: `1px solid ${G.line2}`, cursor: "pointer" }}
        >
          <MapPin size={12} color={G.green700} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: G.green700, letterSpacing: ".2px" }}>{t("shifts.whereWhy")}</span>
          <ChevronDown size={13} color={G.green700} />
        </button>
      )}

      {open && <DetailPanel d={w.detail} reason={w.reason} tag={tag} areas={winAreas} spots={winSpots} windowId={w.id} fb={fb} isMidday={isMidday} />}
    </div>
  );
}

export default function ShiftsPage() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  const t = useT();
  const lang = useLang();
  const [zone, setZone] = useState<Zone | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [traffic, setTraffic] = useState<{ level: "light" | "moderate" | "heavy" } | null>(null);
  const [zoneStats, setZoneStats] = useState<Record<string, ZoneStat> | null>(null);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");

  useEffect(() => {
    if (!loading && !profile) router.push("/onboarding");
  }, [loading, profile]);

  // Ask for location — callable on mount AND from the "Enable location" button.
  const askLocation = () => {
    if (!("geolocation" in navigator)) { setLocationStatus("denied"); return; }
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        setZone(detectZone(lat, lon));
        setCoords({ lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false }
    );
  };

  useEffect(() => {
    if (!profile) return;
    trackEvent({ type: "shift_plan_viewed", profession: profile.profession, language: profile.language });
    askLocation();
  }, [profile]);

  // Load this rider's past votes (one vote per zone, per device).
  useEffect(() => {
    try { const v = JSON.parse(localStorage.getItem("rk-spot-votes") || "[]"); if (Array.isArray(v)) setVoted(new Set(v)); } catch { /* ignore */ }
  }, []);

  // Crowdsourced busy/quiet stats for this gig type (null until Supabase table exists).
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    fetchZoneStats(profile.profession).then((s) => { if (!cancelled && s) setZoneStats(s); });
    return () => { cancelled = true; };
  }, [profile]);

  // Pull real nearby places for THIS gig type from OpenStreetMap (/api/hotspots).
  useEffect(() => {
    if (!profile || !coords) return;
    let cancelled = false;
    fetch(`/api/hotspots?lat=${coords.lat}&lon=${coords.lon}&prof=${profile.profession}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (Array.isArray(j?.spots)) setSpots(j.spots);
        if (Array.isArray(j?.areas)) setAreas(j.areas);
      })
      .catch(() => { /* keep playbook spots */ });
    // Live road congestion (TomTom; no-op without TOMTOM_API_KEY).
    fetch(`/api/traffic?lat=${coords.lat}&lon=${coords.lon}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled && j?.available) setTraffic({ level: j.level }); })
      .catch(() => { /* no traffic signal */ });
    return () => { cancelled = true; };
  }, [profile, coords]);

  if (loading || !profile) return null;

  const now = new Date();
  const allWindows = windowsFor(profile.profession, zone, now, lang);
  const avoidWindow = allWindows.find((w) => w.tag === "avoid");
  const rideWindows = allWindows.filter((w) => w.tag !== "avoid");
  const areaLabel = zone ? zone.label : t("common.ncr");
  const vote = (zone: string, windowId: string, busy: boolean) => {
    setVoted((prev) => {
      const n = new Set(prev); n.add(zone);
      try { localStorage.setItem("rk-spot-votes", JSON.stringify([...n])); } catch { /* ignore */ }
      return n;
    });
    setZoneStats((prev) => {
      const next = { ...(prev ?? {}) };
      const s = next[zone] ? { ...next[zone] } : { busy: 0, quiet: 0, score: 0 };
      if (busy) s.busy++; else s.quiet++;
      s.score = s.busy / Math.max(1, s.busy + s.quiet);
      next[zone] = s; return next;
    });
    submitSpotFeedback({ zone, profession: profile.profession, windowId, busy });
  };
  const feedback: Feedback = { stats: zoneStats, voted, vote };

  const dateStr = now.toLocaleDateString(localeTag(lang), { weekday: "long", day: "numeric", month: "long" });

  const hoursArr = [3, 3.5, 1.5, 2, 3, 3.5, 2.5];
  const todayTotal = Math.round(
    rideWindows.slice(0, 3).reduce((s, w, i) => s + w.rphr * (hoursArr[i] ?? 2), 0)
  );

  return (
    <div style={{ background: G.bg, minHeight: "100%", paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ fontSize: 12.5, color: G.muted, fontWeight: 600, marginBottom: 4 }}>{dateStr}</div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 26, letterSpacing: "-.6px", color: G.ink }}>
              {t("shifts.title")}
            </h1>
            <div style={{ marginTop: 4, fontSize: 13, color: G.muted }}>
              {profTitle(profile.profession, lang)} · {zone ? zone.label : t("common.ncr")}
            </div>
          </div>
          {/* Location indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 10, background: locationStatus === "granted" ? G.green50 : G.surface, border: `1px solid ${locationStatus === "granted" ? G.green100 : G.line}`, flexShrink: 0, marginTop: 2 }}>
            <MapPin size={13} color={locationStatus === "granted" ? G.green : G.faint} />
            <span style={{ fontSize: 11, fontWeight: 700, color: locationStatus === "granted" ? G.green700 : G.faint }}>
              {locationStatus === "requesting" ? t("loc.locating") : locationStatus === "granted" ? t("loc.located") : t("loc.ncr")}
            </span>
          </div>
        </div>
      </div>

      {/* Live traffic near you (TomTom) */}
      {traffic && (
        <div style={{ margin: "14px 20px 0", display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", borderRadius: 12, flexWrap: "wrap",
          background: traffic.level === "heavy" ? G.redBg : traffic.level === "moderate" ? G.amberBg : G.green50,
          border: `1px solid ${traffic.level === "heavy" ? "rgba(201,59,53,.3)" : traffic.level === "moderate" ? G.amber : G.green100}` }}>
          <span style={{ fontSize: 14 }}>🚦</span>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: traffic.level === "heavy" ? G.redInk : traffic.level === "moderate" ? G.amberInk : G.green700 }}>
            {t("shifts.trafficNow")}: {t(traffic.level === "heavy" ? "traffic.heavy" : traffic.level === "moderate" ? "traffic.moderate" : "traffic.light")}
          </span>
          {traffic.level === "heavy" && <span style={{ fontSize: 11.5, color: G.redInk, lineHeight: 1.35 }}>· {t("shifts.trafficHeavyTip")}</span>}
        </div>
      )}

      {/* Today's total hero */}
      <div style={{ margin: "18px 20px 0" }}>
        <div style={{ borderRadius: 22, padding: "18px 20px", background: "linear-gradient(150deg,#0B6B48,#064D33 60%,#032D1E 100%)", boxShadow: "0 20px 48px -18px rgba(4,77,51,.55)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: -30, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.14), transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".8px", textTransform: "uppercase", color: "rgba(255,255,255,.8)", marginBottom: 10 }}>{t("shifts.top3")}</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 14 }}>
              <span style={{ fontWeight: 800, fontSize: 40, letterSpacing: "-1.4px", color: "#fff", lineHeight: .9, fontVariantNumeric: "tabular-nums" }}>₹{todayTotal.toLocaleString("en-IN")}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.75)", marginBottom: 4 }}>{t("shifts.projected")}</span>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={11} /> {t("shifts.workWindow")}
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", fontVariantNumeric: "tabular-nums" }}>8.5 {t("shifts.hrs")}</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,.2)" }} />
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <TrendingUp size={11} /> {t("shifts.vsUsual")}
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>+34%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Honest estimate disclaimer */}
      <div style={{ margin: "7px 20px 0", fontSize: 11, color: G.faint, lineHeight: 1.4 }}>
        * {t("common.estimated")}
      </div>

      {/* Zone note */}
      {zone && (
        <div style={{ margin: "14px 20px 0", padding: "10px 14px", borderRadius: 12, background: G.green50, border: `1px solid ${G.green100}`, display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={14} color={G.green700} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: G.green700 }}>
            {t("shifts.showingSurge")} <strong>{zone.label}</strong>
          </span>
        </div>
      )}

      {/* Location prompt — without it the plan is generic */}
      {locationStatus !== "granted" && (
        <div style={{ margin: "14px 20px 0", padding: "12px 14px", borderRadius: 14, background: G.amberBg, border: "1px solid rgba(201,110,0,.25)", display: "flex", alignItems: "center", gap: 11 }}>
          <MapPin size={18} color={G.amber} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: G.amberInk, lineHeight: 1.2 }}>{t("loc.promptTitle")}</div>
            <div style={{ fontSize: 11.5, color: G.amberInk, opacity: 0.85, marginTop: 2, lineHeight: 1.35 }}>{t("loc.promptSub")}</div>
          </div>
          <button onClick={askLocation} disabled={locationStatus === "requesting"} style={{ flexShrink: 0, padding: "9px 13px", borderRadius: 10, border: "none", background: "linear-gradient(180deg,#0B6B48,#064D33)", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
            {locationStatus === "requesting" ? t("loc.locating") : t("loc.enable")}
          </button>
        </div>
      )}

      {/* Windows */}
      <div style={{ padding: "18px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".7px", textTransform: "uppercase", color: G.faint }}>{t("shifts.allWindows")}</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: G.green700 }}>{rideWindows.length} {t("shifts.ride")}{avoidWindow ? ` · 1 ${t("shifts.avoid")}` : ""}</span>
        </div>
        {rideWindows.map((w, i) => <WindowCard key={i} w={w} idx={i} isAvoid={false} active={isWindowActive(w, now)} spots={spots} areas={areas} areaName={areaLabel} zoneId={zone?.id ?? null} coords={coords} profId={profile.profession} fb={feedback} />)}
        {avoidWindow && <WindowCard w={avoidWindow} idx={0} isAvoid active={isWindowActive(avoidWindow, now)} spots={spots} areas={areas} areaName={areaLabel} zoneId={zone?.id ?? null} coords={coords} profId={profile.profession} fb={feedback} />}
      </div>
    </div>
  );
}
