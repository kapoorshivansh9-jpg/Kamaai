"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { EarningsCurve } from "@/lib/ridekamao-data";

const G = {
  green: "#0A9060", green700: "#045234", green50: "#D8F5E8",
  ink: "#05160E", ink2: "#163022", muted: "#456055", faint: "#7A9A8A",
  line: "#BDD8C8", line2: "#DDF0E6", surface: "#FFFFFF",
  amber: "#C96E00",
};

/** 8-week earnings projection curve (your pace now vs. with RideKamao). */
export function EarningsChart({ curve }: { curve: EarningsCurve }) {
  const W = 340, H = 160, PL = 6, PR = 6, PT = 16, PB = 24;
  const xs = (i: number) => PL + (i / (curve.weeks.length - 1)) * (W - PL - PR);
  const allVals = curve.weeks.flatMap((w) => [w.base, w.proj]);
  const lo = Math.min(...allVals) * 0.93, hi = Math.max(...allVals) * 1.04;
  const ys = (v: number) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);
  const line = (key: "base" | "proj") =>
    curve.weeks.map((w, i) => `${i ? "L" : "M"}${xs(i).toFixed(1)} ${ys(w[key]).toFixed(1)}`).join(" ");
  const area = `${line("proj")} L${xs(curve.weeks.length - 1)} ${H - PB} L${xs(0)} ${H - PB} Z`;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const id = setTimeout(() => setMounted(true), 80); return () => clearTimeout(id); }, []);
  const uplift = Math.round(((curve.projected - curve.now) / curve.now) * 100);
  const t = useT();

  return (
    <div style={{ background: G.surface, borderRadius: 18, padding: "16px 14px 10px", border: `1px solid ${G.line}`, boxShadow: "0 2px 8px -4px rgba(10,24,18,.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14.5, color: G.ink }}>{t("shifts.earningsProjection")}</div>
          <div style={{ fontSize: 11.5, color: G.muted, marginTop: 2 }}>{t("shifts.eightWeeks")}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 8, background: G.green50 }}>
          <TrendingUp size={13} color={G.green700} />
          <span style={{ fontWeight: 800, fontSize: 13, color: G.green700, fontVariantNumeric: "tabular-nums" }}>+{uplift}%</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: G.faint, textTransform: "uppercase" }}>{t("shifts.nowWeek")}</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: G.ink2, fontVariantNumeric: "tabular-nums" }}>₹{curve.now.toLocaleString("en-IN")}</div>
        </div>
        <div style={{ color: G.faint, fontSize: 16, marginBottom: 3 }}>→</div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: G.green700, textTransform: "uppercase" }}>{t("shifts.week8")}</div>
          <div style={{ fontWeight: 800, fontSize: 21, color: G.green700, letterSpacing: "-.4px", fontVariantNumeric: "tabular-nums" }}>₹{curve.projected.toLocaleString("en-IN")}</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="ef" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={G.green} stopOpacity="0.25" />
            <stop offset="100%" stopColor={G.green} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0,1,2,3].map((i) => { const y = PT + i * ((H-PT-PB)/3); return <line key={i} x1={PL} y1={y} x2={W-PR} y2={y} stroke={G.line2} strokeWidth="1" />; })}
        <line x1={PL} y1={ys(curve.target)} x2={W-PR} y2={ys(curve.target)} stroke={G.amber} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
        <path d={area} fill="url(#ef)" opacity={mounted ? 1 : 0} style={{ transition: "opacity .8s .3s" }} />
        <path d={line("base")} fill="none" stroke={G.faint} strokeWidth="1.8" strokeDasharray="3 4" opacity="0.5" />
        <path d={line("proj")} fill="none" stroke={G.green} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="900" strokeDashoffset={mounted ? 0 : 900} style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)" }} />
        <circle cx={xs(curve.weeks.length-1)} cy={ys(curve.projected)} r="5" fill={G.green} stroke="#fff" strokeWidth="2" opacity={mounted ? 1 : 0} style={{ transition: "opacity .4s 1.2s" }} />
        {curve.weeks.map((w, i) => (i % 2 === 0 || i === curve.weeks.length - 1) && (
          <text key={i} x={xs(i)} y={H-6} textAnchor="middle" fontSize="9" fill={G.faint}>W{w.w}</text>
        ))}
      </svg>
    </div>
  );
}
