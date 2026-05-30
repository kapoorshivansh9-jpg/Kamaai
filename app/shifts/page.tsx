"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/ridekamao-profile";
import { windowsFor, earningsCurve, AVOID_WINDOW, getProfession } from "@/lib/ridekamao-data";
import type { ShiftWindow, EarningsCurve } from "@/lib/ridekamao-data";

const G = {
  green: "#0E9A6E", green700: "#057A55", green600: "#0B8C63",
  green50: "#E8F6EF", green100: "#D2EEE0",
  ink: "#0C1A14", ink2: "#27352E", muted: "#5E6E66", faint: "#8A9A92",
  line: "#E3EAE6", line2: "#EEF3F0", surface: "#FFFFFF", bg: "#EEF3F0",
  amber: "#E08A0B", amberBg: "#FBEBCF", amberInk: "#8A5208",
  red: "#D6453F", redBg: "#FAE0DE", redInk: "#92231F",
};

const TAG_STYLES = {
  surge:  { bg: G.amberBg, ink: G.amberInk, bar: "linear-gradient(90deg,#E08A0B,#E0700B)" },
  cool:   { bg: "#E4ECFC",  ink: "#1B43A8",  bar: "linear-gradient(90deg,#13A878,#0B8C63)" },
  steady: { bg: G.green50, ink: G.green700,  bar: "linear-gradient(90deg,#13A878,#0B8C63)" },
};

function WindowCard({ w, idx }: { w: ShiftWindow; idx: number }) {
  const [open, setOpen] = useState(idx === 0);
  const tag = TAG_STYLES[w.tag];
  return (
    <div
      style={{
        background: G.surface, borderRadius: 18, padding: "15px 16px", marginBottom: 11,
        border: `1px solid ${G.line}`, boxShadow: "0 1px 2px rgba(12,26,20,.06),0 8px 24px -12px rgba(12,26,20,.18)",
        animation: `rk-fadeUp .45s ${idx * 0.07}s both`,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <div
          style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: idx === 1 ? G.ink : G.green50,
            color: idx === 1 ? "#fff" : G.green700,
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 16, fontVariantNumeric: "tabular-nums" }}>{idx + 1}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: G.ink, letterSpacing: "-.3px", fontVariantNumeric: "tabular-nums" }}>{w.time}</div>
          <div style={{ fontSize: 12.5, color: G.muted, marginTop: 1 }}>{w.label}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: G.green700, fontVariantNumeric: "tabular-nums" }}>₹{w.rphr}</div>
          <div style={{ fontSize: 10.5, color: G.faint, fontWeight: 600 }}>per hour</div>
        </div>
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 13 }}>
        <div style={{ flex: 1, height: 7, borderRadius: 4, background: G.line2, overflow: "hidden" }}>
          <div style={{ width: `${w.demand * 100}%`, height: "100%", borderRadius: 4, background: tag.bar, transition: "width .6s" }} />
        </div>
        <span
          style={{
            padding: "3px 9px", borderRadius: 7, fontSize: 11, fontWeight: 700,
            background: tag.bg, color: tag.ink,
          }}
        >
          {w.tagText}
        </span>
      </div>

      {open && (
        <div
          style={{
            display: "flex", gap: 9, marginTop: 13, paddingTop: 13,
            borderTop: `1px solid ${G.line2}`, animation: "rk-fadeUp .3s both",
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: G.ink2 }}>{w.reason}</p>
        </div>
      )}
    </div>
  );
}

function AvoidCard() {
  return (
    <div
      style={{
        background: G.redBg, borderRadius: 18, padding: "14px 16px",
        border: `1px solid rgba(214,69,63,.25)`, display: "flex", gap: 12, alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
        }}
      >
        ⚠️
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: G.redInk, fontVariantNumeric: "tabular-nums" }}>{AVOID_WINDOW.time}</span>
          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 700, background: G.red, color: "#fff" }}>AVOID</span>
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.45, color: G.redInk }}>{AVOID_WINDOW.reason}</p>
      </div>
    </div>
  );
}

function EarningsChart({ curve }: { curve: EarningsCurve }) {
  const W = 560, H = 190, PL = 8, PR = 8, PT = 18, PB = 30;
  const xs = (i: number) => PL + (i / (curve.weeks.length - 1)) * (W - PL - PR);
  const allVals = curve.weeks.flatMap((w) => [w.base, w.proj]);
  const lo = Math.min(...allVals) * 0.92, hi = Math.max(...allVals) * 1.04;
  const ys = (v: number) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);
  const line = (key: "base" | "proj") =>
    curve.weeks.map((w, i) => `${i ? "L" : "M"}${xs(i).toFixed(1)} ${ys(w[key]).toFixed(1)}`).join(" ");
  const area = `${line("proj")} L${xs(curve.weeks.length - 1)} ${H - PB} L${xs(0)} ${H - PB} Z`;
  const targetY = ys(curve.target);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);
  const uplift = Math.round(((curve.projected - curve.now) / curve.now) * 100);

  return (
    <div
      style={{
        background: G.surface, borderRadius: 20, padding: "18px 16px 12px",
        border: `1px solid ${G.line}`, boxShadow: "0 1px 3px rgba(12,26,20,.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: G.ink, letterSpacing: "-.3px" }}>Your earnings, projected</div>
          <div style={{ fontSize: 12.5, color: G.muted, marginTop: 2 }}>Next 8 weeks with RideKamao</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 9px", borderRadius: 9, background: G.green50 }}>
          <span style={{ fontSize: 14 }}>📈</span>
          <span style={{ fontWeight: 800, fontSize: 14, color: G.green700, fontVariantNumeric: "tabular-nums" }}>+{uplift}%</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 18, margin: "0 2px 14px" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: G.faint }}>NOW · weekly</div>
          <div style={{ fontWeight: 700, fontSize: 19, color: G.ink2, fontVariantNumeric: "tabular-nums" }}>₹{curve.now.toLocaleString("en-IN")}</div>
        </div>
        <span style={{ fontSize: 18, color: G.faint, marginBottom: 4 }}>→</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: G.green700 }}>WEEK 8 · projected</div>
          <div style={{ fontWeight: 800, fontSize: 24, color: G.green700, letterSpacing: "-.6px", fontVariantNumeric: "tabular-nums" }}>₹{curve.projected.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="earnFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#13A878" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#13A878" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => {
          const y = PT + i * ((H - PT - PB) / 3);
          return <line key={i} x1={PL} y1={y} x2={W - PR} y2={y} stroke={G.line2} strokeWidth="1" />;
        })}
        <line x1={PL} y1={targetY} x2={W - PR} y2={targetY} stroke={G.amber} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
        <text x={W - PR} y={targetY - 6} textAnchor="end" fontWeight="700" fontSize="10.5" fill={G.amberInk}>
          Target ₹{(curve.target / 1000).toFixed(0)}k
        </text>
        <path d={area} fill="url(#earnFill)" opacity={mounted ? 1 : 0} style={{ transition: "opacity .8s .3s" }} />
        <path d={line("base")} fill="none" stroke={G.faint} strokeWidth="2" strokeDasharray="3 4" opacity="0.55" />
        <path
          d={line("proj")} fill="none" stroke="#0B8C63" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="1200" strokeDashoffset={mounted ? 0 : 1200}
          style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.4,0,.2,1)" }}
        />
        <circle cx={xs(curve.weeks.length - 1)} cy={ys(curve.projected)} r="5.5" fill="#0B8C63" stroke="#fff" strokeWidth="2.5"
          opacity={mounted ? 1 : 0} style={{ transition: "opacity .4s 1.2s" }} />
        {curve.weeks.map((w, i) =>
          (i % 2 === 0 || i === curve.weeks.length - 1) ? (
            <text key={i} x={xs(i)} y={H - 8} textAnchor="middle" fontSize="9.5" fill={G.faint}>W{w.w}</text>
          ) : null
        )}
      </svg>

      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8, paddingTop: 10, borderTop: `1px solid ${G.line2}` }}>
        {[
          { color: "#0B8C63", label: "With RideKamao", dashed: false },
          { color: G.faint, label: "On your own", dashed: true },
          { color: G.amber, label: "Your target", dashed: true },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 16, height: 0, borderTop: `${l.dashed ? "2px dashed" : "3px solid"} ${l.color}`, display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: G.muted }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShiftsPage() {
  const router = useRouter();
  const { profile, loading } = useProfile();

  useEffect(() => {
    if (!loading && !profile) router.push("/onboarding");
  }, [loading, profile]);

  if (loading || !profile) return null;

  const profession = getProfession(profile.profession);
  const windows = windowsFor(profile.profession);
  const curve = earningsCurve(profile);
  const hoursArr = [3, 3.5, 1.5];
  const todayTotal = Math.round(windows.reduce((s, w, i) => s + w.rphr * hoursArr[i], 0));
  const totalHours = hoursArr.reduce((a, b) => a + b, 0);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ background: G.bg, minHeight: "100%", padding: "0 0 40px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px 0" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: G.muted, fontWeight: 600 }}>{dateStr}</div>
            <h1 style={{ margin: "3px 0 0", fontWeight: 800, fontSize: 28, letterSpacing: "-.6px", color: G.ink }}>
              Namaste, {profile.name} 👋
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: G.muted }}>
              {profession?.icon} {profession?.title}
            </p>
          </div>
          <button
            onClick={() => router.push("/heat")}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 12,
              background: G.amberBg, border: "none", cursor: "pointer", flexShrink: 0, marginTop: 4,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E0700B", animation: "rk-pulse 1.6s infinite", display: "inline-block" }} />
            <span style={{ fontWeight: 700, fontSize: 12.5, color: G.amberInk, whiteSpace: "nowrap" }}>
              Heat HIGH · 46°
            </span>
          </button>
        </div>

        {/* Today hero */}
        <div
          style={{
            marginBottom: 24, borderRadius: 22, padding: "20px 20px 18px",
            position: "relative", overflow: "hidden",
            background: "linear-gradient(155deg,#0FA075,#067352 85%)",
            boxShadow: "0 22px 44px -22px rgba(6,115,82,.6)",
            animation: "rk-fadeUp .45s both",
          }}
        >
          <div
            style={{
              position: "absolute", top: -50, right: -30, width: 180, height: 180,
              borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.18), transparent 65%)",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 7, position: "relative" }}>
            <span style={{ fontSize: 14 }}>✨</span>
            <span style={{ fontWeight: 700, fontSize: 12.5, letterSpacing: ".8px", textTransform: "uppercase", color: "rgba(255,255,255,.82)" }}>
              Today's smart plan
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 12, position: "relative" }}>
            <span style={{ fontWeight: 800, fontSize: 44, letterSpacing: "-1.6px", color: "#fff", lineHeight: .9, fontVariantNumeric: "tabular-nums" }}>
              ₹{todayTotal.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.8)", marginBottom: 5 }}>projected</span>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 16, position: "relative" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13 }}>🕐</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,.7)" }}>Work window</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{totalHours} hrs</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,.22)" }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13 }}>📈</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,.7)" }}>vs usual day</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", marginTop: 2 }}>+34%</div>
            </div>
          </div>
        </div>

        {/* Shift windows */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 2px 11px" }}>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: ".6px", textTransform: "uppercase", color: G.faint }}>
            Best times to ride today
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: G.green700 }}>3 windows</span>
        </div>
        {windows.map((w, i) => <WindowCard key={i} w={w} idx={i} />)}
        <div style={{ marginTop: 13, marginBottom: 24 }}><AvoidCard /></div>

        {/* Earnings chart */}
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: ".6px", textTransform: "uppercase", color: G.faint }}>
            Earnings outlook
          </span>
        </div>
        <EarningsChart curve={curve} />
      </div>
    </div>
  );
}
