"use client";

import { Thermometer, Wind, Droplets, Flame, MapPin, AlertTriangle, Info } from "lucide-react";
import { HEAT } from "@/lib/ridekamao-data";
import type { HeatMetric, SattuPoint } from "@/lib/ridekamao-data";

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

function FatigueTimeline() {
  const d = HEAT;
  const idx2p = d.hours.findIndex((h) => h.h === "2p");
  const markerPct = ((idx2p + 0.5) / d.hours.length) * 100;
  return (
    <div style={{ background: G.surface, borderRadius: 18, padding: "15px 16px 14px", border: `1px solid ${G.line}`, boxShadow: "0 2px 8px -4px rgba(10,24,18,.1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: G.redBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Flame size={18} color={G.red} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, color: G.ink }}>Projected fatigue hour</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 1 }}>When heat strain peaks for your body</div>
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
        {[["Safe", RISK_COLORS[0]], ["Caution", RISK_COLORS[1]], ["High", RISK_COLORS[2]], ["Extreme", RISK_COLORS[3]]].map(([l, c]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: c, display: "inline-block" }} />
            <span style={{ fontSize: 10.5, color: G.muted, fontWeight: 600 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SattuSection({ points }: { points: SattuPoint[] }) {
  return (
    <div style={{ background: G.surface, borderRadius: 18, overflow: "hidden", border: `1px solid ${G.line}`, boxShadow: "0 2px 8px -4px rgba(10,24,18,.1)" }}>
      {/* Map placeholder */}
      <div style={{ height: 120, position: "relative", background: "repeating-linear-gradient(45deg,#E2F0E8,#E2F0E8 10px,#D8EBE0 10px,#D8EBE0 20px)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(200px 120px at 40% 60%, rgba(12,146,103,.1), transparent 70%)" }} />
        {[["28%","42%"],["58%","30%"],["72%","62%"]].map(([l, t], i) => (
          <div key={i} style={{ position: "absolute", left: l, top: t, transform: "translate(-50%,-100%)" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: G.green, border: "2.5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 8px rgba(0,0,0,.2)" }}>
              <Droplets size={13} color="#fff" />
            </div>
          </div>
        ))}
        <div style={{ position: "absolute", left: "45%", top: "75%", transform: "translate(-50%,-50%)" }}>
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: G.blue, border: "3px solid #fff", boxShadow: "0 0 0 4px rgba(30,86,212,.18)" }} />
        </div>
        <div style={{ position: "absolute", bottom: 7, right: 10, fontWeight: 700, fontSize: 9.5, letterSpacing: ".5px", color: G.faint, background: "rgba(255,255,255,.85)", padding: "2px 6px", borderRadius: 5 }}>
          MAP · LIVE
        </div>
      </div>
      {points.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: i < points.length - 1 ? `1px solid ${G.line2}` : "none" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: G.green50, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MapPin size={17} color={G.green700} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: G.ink, lineHeight: 1.2 }}>{p.name}</div>
            <div style={{ fontSize: 11.5, color: G.muted, marginTop: 2 }}>{p.stock} · {p.time}</div>
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: G.green700, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{p.dist}</span>
        </div>
      ))}
    </div>
  );
}

export default function HeatPage() {
  const isHigh = HEAT.level === "high";

  return (
    <div style={{ background: G.bg, minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* Heading */}
        <div style={{ padding: "24px 20px 0" }}>
          <h1 style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 26, letterSpacing: "-.6px", color: G.ink }}>Heat Safety</h1>
          <div style={{ fontSize: 12.5, color: G.muted }}>Updated 9:40 AM · refreshes hourly · Delhi NCR</div>
        </div>

        {/* Hero */}
        <div style={{ margin: "16px 20px 0" }}>
          <div style={{ borderRadius: 22, padding: "20px 20px 22px", position: "relative", overflow: "hidden", background: "linear-gradient(155deg,#D45C00,#B03A00 90%)", boxShadow: "0 18px 40px -20px rgba(180,60,0,.55)", animation: "rk-fadeUp .4s both" }}>
            <div style={{ position: "absolute", top: -30, right: -20, opacity: .12 }}>
              <Flame size={140} color="#fff" />
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", animation: "rk-pulse 1.5s infinite", display: "inline-block" }} />
                <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".8px", textTransform: "uppercase", color: "rgba(255,255,255,.85)" }}>
                  Heat Safety Index · Delhi NCR
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 44, lineHeight: .9, letterSpacing: "-1.4px", color: "#fff" }}>{HEAT.levelLabel}</div>
                  <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.85)", marginTop: 8, fontWeight: 600 }}>Take regular breaks and hydrate</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 38, color: "#fff", letterSpacing: -1, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{HEAT.feelsLike}°</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.75)", fontWeight: 600 }}>feels like</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics grid */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".7px", textTransform: "uppercase", color: G.faint, marginBottom: 11 }}>Right now</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {HEAT.metrics.map((m) => <MetricTile key={m.id} m={m} />)}
          </div>
        </div>

        {/* Fatigue timeline */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".7px", textTransform: "uppercase", color: G.faint, marginBottom: 11 }}>Plan your breaks</div>
          <FatigueTimeline />
        </div>

        {/* Sattu map */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
            <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".7px", textTransform: "uppercase", color: G.faint }}>Free Sattu &amp; ORS points</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: G.green700 }}>3 nearby</span>
          </div>
          <SattuSection points={HEAT.sattu} />
        </div>

        {/* Advice card */}
        <div style={{ margin: "16px 20px 0" }}>
          <div style={{ background: G.blueBg, borderRadius: 16, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Droplets size={18} color={G.blue} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: G.blueInk, marginBottom: 4 }}>Beat the heat today</div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: G.blueInk }}>
                Drink 1 glass water every 30 min · carry ORS · park in shade · wear light cotton. Skip the 12–3:30 PM window.
              </p>
            </div>
          </div>
        </div>

        {/* Avoid banner */}
        <div style={{ margin: "12px 20px 0" }}>
          <div style={{ background: "#FDE8E7", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(201,59,53,.2)" }}>
            <AlertTriangle size={18} color={G.red} />
            <p style={{ margin: 0, fontSize: 13, color: "#7A1F1B", fontWeight: 600 }}>
              Avoid riding 12:00 – 3:30 PM today. Heat index: 46°C
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
