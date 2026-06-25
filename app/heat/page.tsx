"use client";

import { useState, useEffect } from "react";
import { Thermometer, Wind, Droplets, Flame, MapPin, AlertTriangle, Info, Navigation, Phone } from "lucide-react";
import { getHeat } from "@/lib/ridekamao-data";
import { useT, useLang, localeTag } from "@/lib/i18n";
import { fetchNearbyWaterPoints, addWaterPoint } from "@/lib/supabase-events";
import { supabaseConfigured } from "@/lib/supabase-browser";
import type { HeatMetric, SattuPoint, HeatData } from "@/lib/ridekamao-data";

const G = {
  ink: "#05160E", ink2: "#163022", muted: "#456055", faint: "#7A9A8A",
  line: "#BDD8C8", line2: "#DDF0E6", surface: "#FFFFFF", bg: "#EBF7F1",
  green: "#0A9060", green50: "#D8F5E8", green100: "#B4EAD0", green700: "#045234",
  red: "#B83030", redBg: "#FCEAEA",
  blue: "#1A4FCC", blueBg: "#E0EAFF", blueInk: "#0C2A7A",
};

const TONE = {
  safe: { c: "#1E9C47", bg: "#E2F6E8" },
  mod:  { c: "#D97B00", bg: "#FEF0D6" },
  high: { c: "#D45C00", bg: "#FFE8D4" },
  ext:  { c: "#C93B35", bg: "#FDE8E7" },
};

const RISK_COLORS = ["#1E9C47", "#D97B00", "#D45C00", "#C93B35"];

const METRIC_ICONS = {
  aqi:  Wind,
  temp: Thermometer,
  hum:  Droplets,
  uv:   Flame,
};

// ── Live conditions (from /api/conditions) ────────────────────
type Tone = "safe" | "mod" | "high" | "ext";
interface Live { live: true; tempC: number | null; feelsLikeC: number; humidity: number | null; aqi: number | null; uv: number | null; level: Tone; }

// India CPCB AQI from PM2.5/PM10 (same bands as the server route). Used by the
// browser-side fallback below so a stale "500" sample never sticks around.
const PM25_BANDS = [[0, 30, 0, 50], [30, 60, 51, 100], [60, 90, 101, 200], [90, 120, 201, 300], [120, 250, 301, 400], [250, 500, 401, 500]];
const PM10_BANDS = [[0, 50, 0, 50], [50, 100, 51, 100], [100, 250, 101, 200], [250, 350, 201, 300], [350, 430, 301, 400], [430, 600, 401, 500]];
function cpcbSub(c: number, bands: number[][]): number {
  for (const [cl, ch, il, ih] of bands) if (c <= ch) return Math.round(((ih - il) / (ch - cl)) * (c - cl) + il);
  return 500;
}
function cpcbAqi(pm25: number | null, pm10: number | null): number | null {
  const idx: number[] = [];
  if (typeof pm25 === "number") idx.push(cpcbSub(pm25, PM25_BANDS));
  if (typeof pm10 === "number") idx.push(cpcbSub(pm10, PM10_BANDS));
  return idx.length ? Math.max(...idx) : null;
}
// Open-Meteo is CORS-enabled, so the browser can reach it even when the dev
// server's outbound fetch is blocked (the cause of the stale-AQI bug).
async function conditionsDirect(lat: number, lon: number): Promise<Live | null> {
  try {
    const [wr, ar] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,uv_index`),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,us_aqi`),
    ]);
    const w = wr.ok ? (await wr.json())?.current ?? {} : {};
    const a = ar.ok ? (await ar.json())?.current ?? {} : {};
    const tempC = typeof w.temperature_2m === "number" ? w.temperature_2m : null;
    const feels = typeof w.apparent_temperature === "number" ? w.apparent_temperature : (tempC ?? 0);
    const aqi = cpcbAqi(typeof a.pm2_5 === "number" ? a.pm2_5 : null, typeof a.pm10 === "number" ? a.pm10 : null) ?? (typeof a.us_aqi === "number" ? a.us_aqi : null);
    if (tempC == null && aqi == null) return null;
    const level: Tone = feels >= 45 ? "ext" : feels >= 40 ? "high" : feels >= 36 ? "mod" : "safe";
    return { live: true, tempC, feelsLikeC: Math.round(feels), humidity: typeof w.relative_humidity_2m === "number" ? Math.round(w.relative_humidity_2m) : null, aqi, uv: typeof w.uv_index === "number" ? Math.round(w.uv_index) : null, level };
  } catch { return null; }
}

const TONE_KEY: Record<Tone, "heat.safe" | "heat.caution" | "heat.high" | "heat.extreme"> = {
  safe: "heat.safe", mod: "heat.caution", high: "heat.high", ext: "heat.extreme",
};
const HERO_BG: Record<Tone, string> = {
  safe: "linear-gradient(155deg,#0B6B48,#064D33 90%)",
  mod:  "linear-gradient(155deg,#C98A00,#9A6A00 90%)",
  high: "linear-gradient(155deg,#D45C00,#B03A00 90%)",
  ext:  "linear-gradient(155deg,#C0322C,#8A1F1B 90%)",
};
// India CPCB AQI bands: 0–100 ok, 101–200 moderate, 201–300 poor, 301+ very poor/severe.
const aqiTone = (a: number): Tone => (a >= 301 ? "ext" : a >= 201 ? "high" : a >= 101 ? "mod" : "safe");
const tempTone = (c: number): Tone => (c >= 43 ? "ext" : c >= 40 ? "high" : c >= 35 ? "mod" : "safe");
const uvTone = (u: number): Tone => (u >= 11 ? "ext" : u >= 8 ? "high" : u >= 6 ? "mod" : "safe");

function MetricTile({ m }: { m: HeatMetric }) {
  const t = TONE[m.tone];
  const Icon = METRIC_ICONS[m.id as keyof typeof METRIC_ICONS] ?? Info;
  return (
    <div style={{ background: G.surface, borderRadius: 18, padding: "14px 14px", border: `1px solid ${G.line}`, boxShadow: "0 2px 4px rgba(5,22,14,.05), 0 10px 24px -6px rgba(5,22,14,.14)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={t.c} strokeWidth={2} />
        </div>
        <span style={{ padding: "2px 7px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: t.bg, color: t.c }}>{m.cat}</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 26, color: G.ink, letterSpacing: "-.5px", fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
      <div style={{ fontSize: 12, color: G.muted, fontWeight: 600, marginTop: 2 }}>{m.label}</div>
    </div>
  );
}

function FatigueTimeline({ d }: { d: HeatData }) {
  const t = useT();
  const idx2p = d.hours.findIndex((h) => h.h === "2p");
  const markerPct = ((idx2p + 0.5) / d.hours.length) * 100;
  return (
    <div style={{ background: G.surface, borderRadius: 18, padding: "15px 16px 14px", border: `1px solid ${G.line}`, boxShadow: "0 2px 8px -4px rgba(10,24,18,.1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: G.redBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Flame size={18} color={G.red} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, color: G.ink }}>{t("heat.fatigue")}</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 1 }}>{t("heat.fatigueSub")}</div>
        </div>
        <span style={{ fontWeight: 800, fontSize: 17, color: G.red, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{d.fatigueHour}</span>
      </div>

      <div style={{ position: "relative" }}>
        {/* Marker */}
        <div style={{ position: "absolute", top: -12, left: `${markerPct}%`, transform: "translateX(-50%)", zIndex: 2 }}>
          <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `6px solid ${G.ink}`, margin: "0 auto" }} />
        </div>
        <div style={{ display: "flex", gap: 2, height: 13, borderRadius: 5, overflow: "hidden" }}>
          {d.hours.map((h, i) => (
            <div key={i} style={{ flex: 1, background: RISK_COLORS[h.r], opacity: h.r === 0 ? 0.5 : 1 }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          {d.hours.map((h, i) => (i % 3 === 0) && (
            <span key={i} style={{ fontSize: 9.5, color: G.faint, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{h.h}</span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 11, paddingTop: 11, borderTop: `1px solid ${G.line2}` }}>
        {([["heat.safe", RISK_COLORS[0]], ["heat.caution", RISK_COLORS[1]], ["heat.high", RISK_COLORS[2]], ["heat.extreme", RISK_COLORS[3]]] as const).map(([k, c]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: c, display: "inline-block" }} />
            <span style={{ fontSize: 10.5, color: G.muted, fontWeight: 600 }}>{t(k)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pin positions on the stylised map (one per amenity).
const PIN_POS: [string, string][] = [["28%", "46%"], ["58%", "30%"], ["73%", "64%"]];

// Rider amenity categories — emoji glyphs are language-neutral & friendly for low-literacy users.
const AMEN_CATS = ["water", "toilet", "food", "rest", "ev", "parking"] as const;
const CAT_EMOJI: Record<string, string> = { water: "💧", toilet: "🚻", food: "🍲", rest: "🌳", ev: "⚡", parking: "🅿️" };
const catEmoji = (c?: string) => CAT_EMOJI[c || "water"] || "📍";

function WaterMap({ points }: { points: SattuPoint[] }) {
  const t = useT();
  const [sel, setSel] = useState(0);
  const active = points[sel] ?? points[0];
  const mapsHref = (p: SattuPoint) =>
    p.lat != null && p.lon != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ", Delhi NCR")}`;

  return (
    <div style={{ background: G.surface, borderRadius: 18, overflow: "hidden", border: `1px solid ${G.line}`, boxShadow: "0 2px 8px -4px rgba(10,24,18,.1)" }}>
      {/* Interactive map — tap a pin */}
      <div style={{ height: 150, position: "relative", background: "repeating-linear-gradient(45deg,#E2F0E8,#E2F0E8 10px,#D8EBE0 10px,#D8EBE0 20px)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(220px 130px at 45% 60%, rgba(12,146,103,.12), transparent 70%)" }} />
        <div style={{ position: "absolute", top: 8, left: 10, fontSize: 10, fontWeight: 600, color: G.muted, background: "rgba(255,255,255,.82)", padding: "3px 8px", borderRadius: 6 }}>{t("heat.tapPin")}</div>

        {points.map((p, i) => {
          const [l, top] = PIN_POS[i] ?? ["50%", "50%"];
          const on = i === sel;
          return (
            <button key={i} onClick={() => setSel(i)} aria-label={p.name}
              style={{ position: "absolute", left: l, top, transform: "translate(-50%,-100%)", background: "none", border: "none", cursor: "pointer", padding: 0, zIndex: on ? 4 : 1 }}>
              {on && (
                <div style={{ position: "absolute", bottom: "calc(100% + 5px)", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", background: G.ink, color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 7, boxShadow: "0 4px 10px -3px rgba(0,0,0,.4)" }}>
                  {p.name}
                  <span style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `4px solid ${G.ink}` }} />
                </div>
              )}
              <div style={{ width: on ? 34 : 26, height: on ? 34 : 26, borderRadius: "50%", background: G.green, border: "2.5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: on ? "0 0 0 4px rgba(10,144,96,.25), 0 4px 10px rgba(0,0,0,.25)" : "0 3px 8px rgba(0,0,0,.2)", transition: "all .18s" }}>
                <span style={{ fontSize: on ? 16 : 13, lineHeight: 1 }}>{catEmoji(p.category)}</span>
              </div>
            </button>
          );
        })}

        {/* You marker */}
        <div style={{ position: "absolute", left: "45%", top: "80%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: G.blue, border: "3px solid #fff", boxShadow: "0 0 0 4px rgba(30,86,212,.18)" }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: G.blue, background: "rgba(255,255,255,.85)", padding: "1px 5px", borderRadius: 4 }}>{t("heat.you")}</span>
        </div>
        <div style={{ position: "absolute", bottom: 7, right: 10, fontWeight: 700, fontSize: 9.5, letterSpacing: ".5px", color: G.faint, background: "rgba(255,255,255,.85)", padding: "2px 6px", borderRadius: 5 }}>{t("heat.mapLive")}</div>
      </div>

      {/* Selected spot — what's on offer + directions */}
      <div style={{ padding: "13px 14px", borderBottom: `1px solid ${G.line2}`, background: G.green50 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14.5, color: G.ink, lineHeight: 1.2 }}>{active.name}</div>
            <div style={{ fontSize: 11.5, color: G.muted, marginTop: 2 }}>{active.time ? `${active.time} · ` : ""}{active.dist}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
              {active.stock.split(" · ").map((s, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: G.green700, background: "#fff", border: `1px solid ${G.green100}`, padding: "3px 9px", borderRadius: 7 }}>{s}</span>
              ))}
            </div>
          </div>
          <a href={mapsHref(active)} target="_blank" rel="noopener noreferrer"
            style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 11, background: G.green, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 12 }}>
            <Navigation size={14} /> {t("heat.directions")}
          </a>
        </div>
      </div>

      {/* All points — tap to select */}
      {points.map((p, i) => (
        <button key={i} onClick={() => setSel(i)}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", width: "100%", textAlign: "left", background: i === sel ? "rgba(10,144,96,.06)" : "transparent", border: "none", borderBottom: i < points.length - 1 ? `1px solid ${G.line2}` : "none", cursor: "pointer" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: i === sel ? G.green : G.green50, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s" }}>
            <span style={{ fontSize: 17, lineHeight: 1 }}>{catEmoji(p.category)}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: G.ink, lineHeight: 1.2 }}>{p.name}</div>
            <div style={{ fontSize: 11.5, color: G.muted, marginTop: 2 }}>{p.stock}{p.time ? ` · ${p.time}` : ""}</div>
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: G.green700, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{p.dist}</span>
        </button>
      ))}
    </div>
  );
}

export default function HeatPage() {
  const t = useT();
  const lang = useLang();
  const base = getHeat(lang);
  const [updatedAt, setUpdatedAt] = useState("");
  const [live, setLive] = useState<Live | null>(null);
  const [water, setWater] = useState<{ name: string | null; distKm: number; lat: number; lon: number; category?: string }[] | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [cat, setCat] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [addCat, setAddCat] = useState<string>("water");
  const [addName, setAddName] = useState("");

  useEffect(() => {
    setUpdatedAt(new Date().toLocaleTimeString(localeTag(lang), { hour: "numeric", minute: "2-digit" }));
  }, [lang]);

  // Pull live weather + AQI (Open-Meteo, no key needed). Uses the rider's
  // location if allowed (coords coarsened to ~1 km, never stored); otherwise
  // falls back to Delhi NCR centre so real weather still shows.
  useEffect(() => {
    const load = async (lat: number, lon: number) => {
      try {
        const r = await fetch(`/api/conditions?lat=${lat}&lon=${lon}`);
        const j = await r.json();
        // Use the server result only if it's complete; otherwise fetch live
        // weather/AQI straight from the browser so a stale sample never shows.
        if (j?.live && j.tempC != null && j.aqi != null) setLive(j as Live);
        else { const d = await conditionsDirect(lat, lon); setLive(d ?? (j?.live ? (j as Live) : null)); }
      } catch {
        const d = await conditionsDirect(lat, lon);
        if (d) setLive(d);
      }
      setCoords({ lat, lon });
      // Prefer the crowdsourced DB (reliable); fall back to live OSM, then sample.
      const db = await fetchNearbyWaterPoints(lat, lon);
      if (db && db.length) { setWater(db); return; }
      try {
        const r = await fetch(`/api/water?lat=${lat}&lon=${lon}`);
        const j = await r.json();
        if (Array.isArray(j?.points) && j.points.length) setWater(j.points);
      } catch { /* keep sample water points */ }
    };
    const DELHI = { lat: 28.61, lon: 77.21 };
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(Math.round(pos.coords.latitude * 100) / 100, Math.round(pos.coords.longitude * 100) / 100),
        () => load(DELHI.lat, DELHI.lon), // denied / failed → Delhi NCR
        { timeout: 6000, maximumAge: 600000 }
      );
    } else {
      load(DELHI.lat, DELHI.lon);
    }
  }, []);

  // Merge live readings over the sample data where available.
  const level: Tone = live ? live.level : "high";
  const feelsLike = live ? Math.round(live.feelsLikeC) : base.feelsLike;
  const levelLabel = live ? t(TONE_KEY[level]) : base.levelLabel;
  const metrics: HeatMetric[] = live
    ? base.metrics.map((m) => {
        if (m.id === "aqi" && live.aqi != null) { const tone = aqiTone(live.aqi); return { ...m, value: String(live.aqi), tone, cat: t(TONE_KEY[tone]) }; }
        if (m.id === "temp" && live.tempC != null) { const tone = tempTone(live.tempC); return { ...m, value: `${Math.round(live.tempC)}°`, tone, cat: t(TONE_KEY[tone]) }; }
        if (m.id === "hum" && live.humidity != null) return { ...m, value: `${Math.round(live.humidity)}%` };
        if (m.id === "uv" && live.uv != null) { const tone = uvTone(live.uv); return { ...m, value: String(Math.round(live.uv)), tone, cat: t(TONE_KEY[tone]) }; }
        return m;
      })
    : base.metrics;
  const d = base; // fatigue timeline + sample fallback
  // Translate a category id to its localised label (type-safe — no dynamic keys).
  const catLabel = (c?: string) => {
    switch (c) {
      case "toilet": return t("amen.toilet");
      case "food": return t("amen.food");
      case "rest": return t("amen.rest");
      case "ev": return t("amen.ev");
      case "parking": return t("amen.parking");
      default: return t("amen.water");
    }
  };
  // Real nearby amenities (within 5 km) when we have them; else sample list.
  const allPoints: SattuPoint[] = water && water.length
    ? water.map((p) => ({
        name: p.name || catLabel(p.category),
        dist: `${p.distKm} km`,
        time: "",
        stock: catLabel(p.category),
        lat: p.lat,
        lon: p.lon,
        category: p.category || "water",
      }))
    : d.sattu;
  const shown = cat === "all" ? allPoints : allPoints.filter((p) => (p.category || "water") === cat);

  const handleAddSpot = async () => {
    if (!coords || !addName.trim()) return;
    const ok = await addWaterPoint(coords.lat, coords.lon, addName.trim(), addCat);
    if (ok) {
      const db = await fetchNearbyWaterPoints(coords.lat, coords.lon);
      if (db) setWater(db);
      setAddName(""); setAddOpen(false);
      window.alert(t("heat.added"));
    }
  };

  return (
    <div style={{ background: G.bg, minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* Heading */}
        <div style={{ padding: "24px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 26, letterSpacing: "-.6px", color: G.ink }}>{t("heat.title")}</h1>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 800, letterSpacing: ".4px", background: live ? G.green50 : "#EDEFEE", color: live ? G.green700 : G.faint }}>
              {live && <span style={{ width: 5, height: 5, borderRadius: "50%", background: G.green, display: "inline-block", animation: "rk-pulse 1.4s infinite" }} />}
              {live ? t("heat.live") : t("heat.sample")}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: G.muted }}>{updatedAt ? `${t("heat.updated")} ${updatedAt} · ` : ""}{t("heat.refreshes")}</div>
        </div>

        {/* Hero */}
        <div style={{ margin: "16px 20px 0" }}>
          <div style={{ borderRadius: 22, padding: "20px 20px 22px", position: "relative", overflow: "hidden", background: HERO_BG[level], boxShadow: "0 18px 40px -20px rgba(40,40,40,.45)", animation: "rk-fadeUp .4s both" }}>
            <div style={{ position: "absolute", top: -30, right: -20, opacity: .12 }}>
              <Flame size={140} color="#fff" />
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", animation: "rk-pulse 1.5s infinite", display: "inline-block" }} />
                <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".8px", textTransform: "uppercase", color: "rgba(255,255,255,.85)" }}>
                  {t("heat.indexNcr")}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 44, lineHeight: .9, letterSpacing: "-1.4px", color: "#fff" }}>{levelLabel}</div>
                  <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.85)", marginTop: 8, fontWeight: 600 }}>{t("heat.takeBreaks")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 38, color: "#fff", letterSpacing: -1, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{feelsLike}°</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.75)", fontWeight: 600 }}>{t("heat.feelsLike")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics grid */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".7px", textTransform: "uppercase", color: G.faint, marginBottom: 11 }}>{t("heat.rightNow")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {metrics.map((m) => <MetricTile key={m.id} m={m} />)}
          </div>
        </div>

        {/* Fatigue timeline */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".7px", textTransform: "uppercase", color: G.faint, marginBottom: 11 }}>{t("heat.planBreaks")}</div>
          <FatigueTimeline d={d} />
        </div>

        {/* Rider amenities map */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
            <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".7px", textTransform: "uppercase", color: G.faint }}>{t("heat.amenities")}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: G.green700 }}>{shown.length} {t("heat.nearby")}</span>
          </div>

          {/* Category filter chips */}
          <div className="noscroll" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 11, marginBottom: 1 }}>
            {["all", ...AMEN_CATS].map((c) => {
              const on = cat === c;
              return (
                <button key={c} onClick={() => setCat(c)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 12px", borderRadius: 9, cursor: "pointer", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", background: on ? G.green : G.surface, border: `1.5px solid ${on ? G.green : G.line}`, color: on ? "#fff" : G.muted }}>
                  {c !== "all" && <span style={{ fontSize: 13 }}>{catEmoji(c)}</span>}
                  {c === "all" ? t("amen.all") : catLabel(c)}
                </button>
              );
            })}
          </div>

          {shown.length > 0 ? (
            <WaterMap key={cat} points={shown} />
          ) : (
            <div style={{ fontSize: 13, color: G.muted, padding: "16px", background: G.surface, borderRadius: 14, border: `1px solid ${G.line}`, textAlign: "center" }}>{t("amen.none")}</div>
          )}

          {supabaseConfigured() && coords && (
            addOpen ? (
              <div style={{ marginTop: 10, padding: "14px", borderRadius: 14, background: G.surface, border: `1.5px solid ${G.green}` }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 11 }}>
                  {AMEN_CATS.map((c) => {
                    const on = addCat === c;
                    return (
                      <button key={c} onClick={() => setAddCat(c)} style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 11px", borderRadius: 9, cursor: "pointer", fontSize: 12.5, fontWeight: 700, background: on ? G.green50 : G.bg, border: `1.5px solid ${on ? G.green : G.line}`, color: on ? G.green700 : G.muted }}>
                        <span style={{ fontSize: 13 }}>{catEmoji(c)}</span>{catLabel(c)}
                      </button>
                    );
                  })}
                </div>
                <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder={t("amen.namePh")}
                  style={{ width: "100%", height: 44, borderRadius: 11, border: `1.5px solid ${G.line}`, padding: "0 13px", fontSize: 15, outline: "none", background: G.bg, color: G.ink, marginBottom: 10 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setAddOpen(false); setAddName(""); }} style={{ flex: 1, height: 44, borderRadius: 11, border: `1.5px solid ${G.line}`, background: G.surface, color: G.muted, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{t("earn.cancel")}</button>
                  <button onClick={handleAddSpot} disabled={!addName.trim()} style={{ flex: 2, height: 44, borderRadius: 11, border: "none", background: addName.trim() ? "linear-gradient(180deg,#0B6B48,#064D33)" : "#B8D8CC", color: "#fff", fontWeight: 700, fontSize: 14, cursor: addName.trim() ? "pointer" : "not-allowed" }}>{t("amen.addBtn")}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setAddOpen(true); if (cat !== "all") setAddCat(cat); }} style={{ marginTop: 10, width: "100%", padding: "11px", borderRadius: 12, background: G.green50, color: G.green700, border: `1.5px dashed ${G.green100}`, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {t("heat.addSpot")}
              </button>
            )
          )}
        </div>

        {/* Advice card */}
        <div style={{ margin: "16px 20px 0" }}>
          <div style={{ background: G.blueBg, borderRadius: 16, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Droplets size={18} color={G.blue} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: G.blueInk, marginBottom: 4 }}>{t("heat.beat")}</div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: G.blueInk }}>
                {t("heat.beatBody")}
              </p>
            </div>
          </div>
        </div>

        {/* Avoid banner */}
        <div style={{ margin: "12px 20px 0" }}>
          <div style={{ background: "#FDE8E7", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(201,59,53,.2)" }}>
            <AlertTriangle size={18} color={G.red} />
            <p style={{ margin: 0, fontSize: 13, color: "#7A1F1B", fontWeight: 600 }}>
              {t("heat.avoidBanner")}
            </p>
          </div>
        </div>

        {/* Emergency services */}
        <div style={{ margin: "12px 20px 0" }}>
          <div style={{ background: G.surface, borderRadius: 16, padding: "14px 16px", border: `1px solid ${G.line}` }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 11 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".7px", color: G.red }}>{t("heat.emergency")}</div>
              <div style={{ fontSize: 10.5, color: G.faint, fontWeight: 600 }}>{t("heat.callNow")}</div>
            </div>

            {/* Primary: unified emergency 112 */}
            <a href="tel:112" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, height: 52, borderRadius: 13, background: "linear-gradient(180deg,#D24B45,#B83030)", color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: 16, boxShadow: "0 10px 24px -10px rgba(184,48,48,.6)", marginBottom: 10 }}>
              <Phone size={18} /> {t("heat.call112")} · 112
            </a>

            {/* Grid of specific services */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: t("heat.ambulance"), num: "108" },
                { label: t("heat.police"), num: "100" },
                { label: t("heat.fire"), num: "101" },
                { label: t("heat.women"), num: "1091" },
                { label: t("heat.roadHelp"), num: "1073" },
              ].map((s) => (
                <a key={s.num} href={`tel:${s.num}`} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: 12, background: G.redBg, border: "1px solid rgba(184,48,48,.18)", textDecoration: "none" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Phone size={14} color={G.red} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: G.ink, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: G.red, lineHeight: 1.2 }}>{s.num}</div>
                  </div>
                </a>
              ))}
              <a href="https://www.google.com/maps/search/?api=1&query=hospital+near+me" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: 12, background: G.green50, border: `1px solid ${G.green100}`, textDecoration: "none" }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MapPin size={14} color={G.green700} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: G.ink, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t("heat.nearestHospital")}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: G.green700, lineHeight: 1.2 }}>Maps</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
