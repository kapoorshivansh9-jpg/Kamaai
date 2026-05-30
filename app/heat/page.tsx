"use client";

import { HEAT } from "@/lib/ridekamao-data";
import type { HeatMetric, SattuPoint } from "@/lib/ridekamao-data";

const G = {
  ink: "#0C1A14", ink2: "#27352E", muted: "#5E6E66", faint: "#8A9A92",
  line: "#E3EAE6", line2: "#EEF3F0", surface: "#FFFFFF", bg: "#EEF3F0",
  green: "#0E9A6E", green50: "#E8F6EF", green700: "#057A55",
  red: "#D6453F", redBg: "#FAE0DE",
  blue: "#2563EB", blueBg: "#E4ECFC", blueInk: "#1B43A8",
};

const TONE = {
  safe: { c: "#23A455", bg: "#E4F4E9" },
  mod:  { c: "#E0A50B", bg: "#FBEFCF" },
  high: { c: "#E0700B", bg: "#FBE6CF" },
  ext:  { c: "#D6453F", bg: "#FAE0DE" },
};
const RISK_COLORS = ["#23A455", "#E0A50B", "#E0700B", "#D6453F"];

function MetricTile({ m }: { m: HeatMetric }) {
  const t = TONE[m.tone];
  return (
    <div style={{ background: G.surface, borderRadius: 16, padding: "13px 14px", border: `1px solid ${G.line}`, boxShadow: "0 1px 3px rgba(12,26,20,.08)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: t.bg, color: t.c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
          {m.icon}
        </div>
        <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: t.bg, color: t.c }}>{m.cat}</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 26, color: G.ink, marginTop: 9, letterSpacing: "-.5px", fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
      <div style={{ fontSize: 12, color: G.muted, fontWeight: 600 }}>{m.label}</div>
    </div>
  );
}

function FatigueTimeline() {
  const d = HEAT;
  const idx2p = d.hours.findIndex((h) => h.h === "2p");
  const markerPct = ((idx2p + 0.5) / d.hours.length) * 100;
  return (
    <div style={{ background: G.surface, borderRadius: 18, padding: "16px 16px 14px", border: `1px solid ${G.line}`, boxShadow: "0 1px 3px rgba(12,26,20,.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "#FAE0DE", color: G.red, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
          🔥
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: G.ink }}>Projected fatigue hour</div>
          <div style={{ fontSize: 12.5, color: G.muted }}>When heat strain peaks for your body</div>
        </div>
        <span style={{ marginLeft: "auto", fontWeight: 800, fontSize: 18, color: G.red, fontVariantNumeric: "tabular-nums" }}>{d.fatigueHour}</span>
      </div>
      <div style={{ position: "relative", marginTop: 20 }}>
        <div style={{ position: "absolute", top: -15, left: `${markerPct}%`, transform: "translateX(-50%)", zIndex: 2 }}>
          <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "6px solid #0C1A14", margin: "0 auto" }} />
        </div>
        <div style={{ display: "flex", gap: 2, height: 14, borderRadius: 5, overflow: "hidden" }}>
          {d.hours.map((h, i) => (
            <div key={i} style={{ flex: 1, background: RISK_COLORS[h.r], opacity: h.r === 0 ? 0.55 : 1 }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {d.hours.map((h, i) => (i % 3 === 0) && (
            <span key={i} style={{ fontSize: 10, color: G.faint, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{h.h}</span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${G.line2}` }}>
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
    <div style={{ background: G.surface, borderRadius: 18, overflow: "hidden", border: `1px solid ${G.line}`, boxShadow: "0 1px 3px rgba(12,26,20,.08)" }}>
      <div
        style={{
          height: 130, position: "relative",
          background: "repeating-linear-gradient(45deg,#EAF1ED,#EAF1ED 11px,#E1EAE5 11px,#E1EAE5 22px)",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(200px 120px at 40% 60%, rgba(14,154,110,.12), transparent 70%)" }} />
        {[["28%", "42%"], ["58%", "30%"], ["72%", "62%"]].map(([l, t], i) => (
          <div key={i} style={{ position: "absolute", left: l, top: t, transform: "translate(-50%,-100%)" }}>
            <div
              style={{
                width: 26, height: 26, borderRadius: "50%", background: G.green,
                border: "2.5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 8px rgba(0,0,0,.2)", fontSize: 13,
              }}
            >
              💧
            </div>
          </div>
        ))}
        <div style={{ position: "absolute", left: "45%", top: "75%", transform: "translate(-50%,-50%)" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: G.blue, border: "3px solid #fff", boxShadow: "0 0 0 4px rgba(37,99,235,.2)" }} />
        </div>
        <div style={{ position: "absolute", bottom: 8, right: 10, fontWeight: 700, fontSize: 10, letterSpacing: ".5px", color: G.faint, background: "rgba(255,255,255,.8)", padding: "3px 7px", borderRadius: 6 }}>
          MAP · LIVE
        </div>
      </div>
      <div style={{ padding: "6px 6px 6px" }}>
        {points.map((p, i) => (
          <div
            key={i}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 10px",
              borderBottom: i < points.length - 1 ? `1px solid ${G.line2}` : "none",
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: G.green50, color: G.green700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
              📍
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: G.ink }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: G.muted, marginTop: 1 }}>{p.stock} · {p.time}</div>
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: G.green700, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{p.dist}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeatPage() {
  return (
    <div style={{ background: G.bg, minHeight: "100%", padding: "0 0 40px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px 0" }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 28, letterSpacing: "-.6px", color: G.ink }}>Heat Safety</h1>
          <div style={{ fontSize: 13, color: G.muted }}>Updated 9:40 AM · refreshes hourly · Delhi NCR</div>
        </div>

        {/* Hero */}
        <div
          style={{
            borderRadius: 22, padding: "20px 20px 22px", marginBottom: 24,
            position: "relative", overflow: "hidden",
            background: "linear-gradient(155deg,#E0700B,#C7510A 90%)",
            boxShadow: "0 22px 44px -22px rgba(199,81,10,.6)",
            animation: "rk-fadeUp .45s both",
          }}
        >
          <div style={{ position: "absolute", top: -30, right: -20, opacity: .15, fontSize: 150, lineHeight: 1 }}>☀️</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, position: "relative" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", animation: "rk-pulse 1.5s infinite", display: "inline-block" }} />
            <span style={{ fontWeight: 700, fontSize: 12.5, letterSpacing: ".8px", textTransform: "uppercase", color: "rgba(255,255,255,.85)" }}>
              Heat Safety Index · Delhi NCR
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: 14, position: "relative" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 42, lineHeight: .92, letterSpacing: "-1.4px", color: "#fff" }}>
                {HEAT.levelLabel}
              </div>
              <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.85)", marginTop: 6, fontWeight: 600 }}>
                Take regular breaks &amp; hydrate
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontWeight: 800, fontSize: 36, color: "#fff", letterSpacing: -1, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {HEAT.feelsLike}°
              </div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.8)", fontWeight: 600 }}>feels like</div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ marginBottom: 11 }}>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: ".6px", textTransform: "uppercase", color: G.faint }}>Right now</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 24 }}>
          {HEAT.metrics.map((m) => <MetricTile key={m.id} m={m} />)}
        </div>

        {/* Fatigue timeline */}
        <div style={{ marginBottom: 11 }}>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: ".6px", textTransform: "uppercase", color: G.faint }}>Plan your breaks</span>
        </div>
        <div style={{ marginBottom: 24 }}><FatigueTimeline /></div>

        {/* Sattu map */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: ".6px", textTransform: "uppercase", color: G.faint }}>Free Sattu &amp; ORS points</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: G.green700 }}>3 nearby</span>
        </div>
        <div style={{ marginBottom: 24 }}><SattuSection points={HEAT.sattu} /></div>

        {/* Advice */}
        <div style={{ background: G.blueBg, borderRadius: 16, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fff", color: G.blue, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
            💧
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: G.blueInk }}>Beat the heat today</div>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, lineHeight: 1.45, color: G.blueInk }}>
              Drink 1 glass water every 30 min · carry ORS · park in shade · wear light cotton. Skip the 12–3:30 PM window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
