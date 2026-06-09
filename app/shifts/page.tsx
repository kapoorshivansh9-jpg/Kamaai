"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, AlertTriangle, Info, TrendingUp, Clock } from "lucide-react";
import { useProfile } from "@/lib/ridekamao-profile";
import { windowsFor, earningsCurve, detectZone, getProfession } from "@/lib/ridekamao-data";
import { trackEvent } from "@/lib/supabase-events";
import type { ShiftWindow, EarningsCurve, Zone } from "@/lib/ridekamao-data";

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

function WindowCard({ w, idx, isAvoid }: { w: ShiftWindow; idx: number; isAvoid: boolean }) {
  const [open, setOpen] = useState(idx === 0 && !isAvoid);
  const tag = TAG[w.tag];

  if (isAvoid) {
    return (
      <div style={{ background: G.redBg, borderRadius: 18, padding: "14px 16px", border: "1px solid rgba(201,59,53,.2)", display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: G.surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <AlertTriangle size={18} color={G.red} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: G.redInk, fontVariantNumeric: "tabular-nums" }}>{w.time}</span>
            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 700, background: G.red, color: "#fff" }}>AVOID</span>
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
          <div style={{ fontWeight: 800, fontSize: 18, color: G.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-.4px", lineHeight: 1.1 }}>{w.time}</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 3, fontWeight: 600 }}>{w.label}</div>
        </div>

        {/* Rate */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: G.green700, fontVariantNumeric: "tabular-nums", letterSpacing: "-.5px", lineHeight: 1 }}>₹{w.rphr}</div>
          <div style={{ fontSize: 10, color: G.faint, fontWeight: 700, marginTop: 3, textTransform: "uppercase", letterSpacing: ".4px" }}>per hour</div>
        </div>
      </button>

      {/* Demand bar + tag */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 14px" }}>
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: G.line2, overflow: "hidden" }}>
          <div style={{ width: `${w.demand * 100}%`, height: "100%", borderRadius: 3, background: tag.bar, transition: "width .8s cubic-bezier(.4,0,.2,1)" }} />
        </div>
        <span style={{ padding: "3px 9px", borderRadius: 7, fontSize: 10.5, fontWeight: 700, background: tag.bg, color: tag.ink, flexShrink: 0, letterSpacing: ".2px" }}>{w.tagText}</span>
      </div>

      {open && (
        <div style={{ display: "flex", gap: 10, padding: "12px 16px 14px", borderTop: `1px solid ${G.line2}`, background: `${tag.bg}50`, animation: "rk-fadeUp .25s both" }}>
          <Info size={13} color={tag.ink} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: G.ink2 }}>{w.reason}</p>
        </div>
      )}
    </div>
  );
}

function EarningsChart({ curve }: { curve: EarningsCurve }) {
  const W = 340, H = 160, PL = 6, PR = 6, PT = 16, PB = 24;
  const xs = (i: number) => PL + (i / (curve.weeks.length - 1)) * (W - PL - PR);
  const allVals = curve.weeks.flatMap((w) => [w.base, w.proj]);
  const lo = Math.min(...allVals) * 0.93, hi = Math.max(...allVals) * 1.04;
  const ys = (v: number) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);
  const line = (key: "base" | "proj") =>
    curve.weeks.map((w, i) => `${i ? "L" : "M"}${xs(i).toFixed(1)} ${ys(w[key]).toFixed(1)}`).join(" ");
  const area = `${line("proj")} L${xs(curve.weeks.length - 1)} ${H - PB} L${xs(0)} ${H - PB} Z`;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  const uplift = Math.round(((curve.projected - curve.now) / curve.now) * 100);

  return (
    <div style={{ background: G.surface, borderRadius: 18, padding: "16px 14px 10px", border: `1px solid ${G.line}`, boxShadow: "0 2px 8px -4px rgba(10,24,18,.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14.5, color: G.ink }}>Earnings projection</div>
          <div style={{ fontSize: 11.5, color: G.muted, marginTop: 2 }}>8 weeks with RideKamao</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 8, background: G.green50 }}>
          <TrendingUp size={13} color={G.green700} />
          <span style={{ fontWeight: 800, fontSize: 13, color: G.green700, fontVariantNumeric: "tabular-nums" }}>+{uplift}%</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: G.faint, textTransform: "uppercase" }}>Now / week</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: G.ink2, fontVariantNumeric: "tabular-nums" }}>₹{curve.now.toLocaleString("en-IN")}</div>
        </div>
        <div style={{ color: G.faint, fontSize: 16, marginBottom: 3 }}>→</div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: G.green700, textTransform: "uppercase" }}>Week 8</div>
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

export default function ShiftsPage() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  const [zone, setZone] = useState<Zone | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");

  useEffect(() => {
    if (!loading && !profile) router.push("/onboarding");
  }, [loading, profile]);

  useEffect(() => {
    if (!profile) return;
    trackEvent({ type: "shift_plan_viewed", profession: profile.profession, language: profile.language });
    if ("geolocation" in navigator) {
      setLocationStatus("requesting");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const z = detectZone(pos.coords.latitude, pos.coords.longitude);
          setZone(z);
          setLocationStatus("granted");
        },
        () => setLocationStatus("denied"),
        { timeout: 6000, maximumAge: 300000 }
      );
    }
  }, [profile]);

  if (loading || !profile) return null;

  const profession = getProfession(profile.profession);
  const allWindows = windowsFor(profile.profession, zone);
  const avoidWindow = allWindows.find((w) => w.tag === "avoid");
  const rideWindows = allWindows.filter((w) => w.tag !== "avoid");

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  const hoursArr = [3, 3.5, 1.5, 2, 3, 3.5, 2.5];
  const todayTotal = Math.round(
    rideWindows.slice(0, 3).reduce((s, w, i) => s + w.rphr * (hoursArr[i] ?? 2), 0)
  );
  const curve = earningsCurve(profile);

  return (
    <div style={{ background: G.bg, minHeight: "100%", paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ fontSize: 12.5, color: G.muted, fontWeight: 600, marginBottom: 4 }}>{dateStr}</div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 26, letterSpacing: "-.6px", color: G.ink }}>
              Shift Planner
            </h1>
            <div style={{ marginTop: 4, fontSize: 13, color: G.muted }}>
              {profession?.title} · {zone ? zone.label : "Delhi NCR"}
            </div>
          </div>
          {/* Location indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 10, background: locationStatus === "granted" ? G.green50 : G.surface, border: `1px solid ${locationStatus === "granted" ? G.green100 : G.line}`, flexShrink: 0, marginTop: 2 }}>
            <MapPin size={13} color={locationStatus === "granted" ? G.green : G.faint} />
            <span style={{ fontSize: 11, fontWeight: 700, color: locationStatus === "granted" ? G.green700 : G.faint }}>
              {locationStatus === "requesting" ? "Locating…" : locationStatus === "granted" ? "Located" : "Delhi NCR"}
            </span>
          </div>
        </div>
      </div>

      {/* Today's total hero */}
      <div style={{ margin: "18px 20px 0" }}>
        <div style={{ borderRadius: 22, padding: "18px 20px", background: "linear-gradient(150deg,#0B6B48,#064D33 60%,#032D1E 100%)", boxShadow: "0 20px 48px -18px rgba(4,77,51,.55)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: -30, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.14), transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".8px", textTransform: "uppercase", color: "rgba(255,255,255,.8)", marginBottom: 10 }}>Today's top 3 windows</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 14 }}>
              <span style={{ fontWeight: 800, fontSize: 40, letterSpacing: "-1.4px", color: "#fff", lineHeight: .9, fontVariantNumeric: "tabular-nums" }}>₹{todayTotal.toLocaleString("en-IN")}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.75)", marginBottom: 4 }}>projected</span>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={11} /> Work window
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", fontVariantNumeric: "tabular-nums" }}>8.5 hrs</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,.2)" }} />
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <TrendingUp size={11} /> vs usual
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>+34%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone note */}
      {zone && (
        <div style={{ margin: "14px 20px 0", padding: "10px 14px", borderRadius: 12, background: G.green50, border: `1px solid ${G.green100}`, display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={14} color={G.green700} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: G.green700 }}>
            Showing surge data for <strong>{zone.label}</strong>
          </span>
        </div>
      )}

      {/* Windows */}
      <div style={{ padding: "18px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".7px", textTransform: "uppercase", color: G.faint }}>All windows today</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: G.green700 }}>{rideWindows.length} ride · 1 avoid</span>
        </div>
        {rideWindows.map((w, i) => <WindowCard key={i} w={w} idx={i} isAvoid={false} />)}
        {avoidWindow && <WindowCard w={avoidWindow} idx={0} isAvoid />}
      </div>

      {/* Earnings chart */}
      <div style={{ padding: "6px 20px 0" }}>
        <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".7px", textTransform: "uppercase", color: G.faint, marginBottom: 12 }}>Earnings outlook</div>
        <EarningsChart curve={curve} />
      </div>
    </div>
  );
}
