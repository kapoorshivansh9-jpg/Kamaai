"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/ridekamao-profile";
import { useUI } from "@/lib/ui-context";
import { PROFESSIONS } from "@/lib/ridekamao-data";
import { ArrowRight, Clock, Thermometer, Shield, MapPin, ChevronRight } from "lucide-react";

const G = {
  green: "#0A9060", greenDark: "#066B47", green700: "#045234",
  green50: "#D8F5E8", green100: "#B4EAD0",
  ink: "#05160E", ink2: "#163022", muted: "#456055", faint: "#7A9A8A",
  line: "#BDD8C8", surface: "#FFFFFF", bg: "#EBF7F1",
  amberBg: "#FFF0D4", amberInk: "#7A3E00", amber: "#C96E00",
};

const features = [
  {
    href: "/shifts",
    label: "Shift Planner",
    desc: "Best windows to ride today",
    Icon: Clock,
    accent: G.green,
    accentBg: G.green50,
    tag: "Live",
    tagColor: G.green,
  },
  {
    href: "/heat",
    label: "Heat Safety",
    desc: "AQI · fatigue hour · hydration points",
    Icon: Thermometer,
    accent: "#B85000",
    accentBg: "#FFE8D0",
    tag: "HIGH today",
    tagColor: "#B85000",
  },
  {
    href: "/rights",
    label: "Know Your Rights",
    desc: "Legal help in your language",
    Icon: Shield,
    accent: "#1A4FCC",
    accentBg: "#E0EAFF",
    tag: "5 topics",
    tagColor: "#1A4FCC",
  },
];

export default function HomePage() {
  const { profile, loading } = useProfile();
  const { openProfile } = useUI();

  const profession = profile ? PROFESSIONS.find((p) => p.id === profile.profession) : null;
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Subah ka" : hour < 17 ? "Dopahar ka" : "Shaam ka";

  return (
    <div style={{ background: G.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>

      {/* ── HERO ─────────────────────────────────────── */}
      <div
        className="road-texture"
        style={{
          background: "linear-gradient(148deg, #0B6B48 0%, #064D33 52%, #032D1E 100%)",
          padding: "44px 22px 28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial glow spots */}
        <div style={{ position:"absolute", top:-80, right:-60, width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle, rgba(10,144,96,.35), transparent 65%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-60, left:-30, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle, rgba(6,107,71,.3), transparent 65%)", pointerEvents:"none" }} />

        {/* Top row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32, position:"relative" }}>
          <div>
            <span style={{ fontWeight:800, fontSize:20, color:"#fff", letterSpacing:"-.4px" }}>
              Ride<span style={{ color:"#5DEBB0" }}>Kamao</span>
            </span>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.45)", marginTop:2, fontWeight:600, letterSpacing:".5px", textTransform:"uppercase" }}>
              Delhi NCR · Shift Intelligence
            </div>
          </div>
          <button
            onClick={openProfile}
            style={{
              width:40, height:40, borderRadius:14,
              background:"rgba(255,255,255,.12)",
              border:"1.5px solid rgba(255,255,255,.2)",
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer",
            }}
          >
            {profile ? (
              <span style={{ color:"#fff", fontWeight:800, fontSize:15, textTransform:"uppercase" }}>
                {profile.name.slice(0,1)}
              </span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M5.5 20.5a6.5 6.5 0 0 1 13 0"/>
              </svg>
            )}
          </button>
        </div>

        {/* Main copy */}
        <div style={{ position:"relative", animation:"rk-fadeUp .4s both" }}>
          {!loading && profile ? (
            <>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.55)", fontWeight:600, letterSpacing:".3px", marginBottom:4 }}>
                {timeGreeting} shukriya,
              </div>
              <h1 style={{ margin:"0 0 6px", fontWeight:800, fontSize:34, letterSpacing:"-1.2px", color:"#fff", lineHeight:1.06 }}>
                {profile.name}
              </h1>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:22 }}>
                <div style={{ padding:"4px 12px", borderRadius:100, background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.18)" }}>
                  <span style={{ color:"rgba(255,255,255,.85)", fontSize:12.5, fontWeight:600 }}>
                    {profession?.title ?? "Rider"} · NCR
                  </span>
                </div>
              </div>
              <Link
                href="/shifts"
                style={{
                  display:"inline-flex", alignItems:"center", gap:8,
                  padding:"11px 18px", borderRadius:14,
                  background:"rgba(255,255,255,.15)", color:"#fff",
                  border:"1.5px solid rgba(255,255,255,.25)",
                  fontWeight:700, fontSize:14, textDecoration:"none",
                  backdropFilter:"blur(8px)",
                }}
              >
                View today's plan
                <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.55)", fontWeight:600, letterSpacing:".4px", textTransform:"uppercase", marginBottom:10 }}>
                Gig workers · Delhi NCR
              </div>
              <h1 style={{ margin:"0 0 12px", fontWeight:800, fontSize:38, letterSpacing:"-1.4px", color:"#fff", lineHeight:1.02 }}>
                Ride smart.<br/>
                <span style={{ color:"#5DEBB0" }}>Earn more.</span>
              </h1>
              <p style={{ margin:"0 0 24px", fontSize:14.5, color:"rgba(255,255,255,.7)", lineHeight:1.55, maxWidth:280 }}>
                Smart shift plans — beat the heat, know your rights.
              </p>
              <Link
                href="/onboarding"
                style={{
                  display:"inline-flex", alignItems:"center", gap:8,
                  padding:"13px 22px", borderRadius:14,
                  background:"#fff", color:G.green700,
                  fontWeight:700, fontSize:15, textDecoration:"none",
                  boxShadow:"0 4px 20px rgba(0,0,0,.18)",
                }}
              >
                Get personalised plans
                <ArrowRight size={17} />
              </Link>
            </>
          )}
        </div>

        {/* Bottom wave trim */}
        <svg viewBox="0 0 480 18" preserveAspectRatio="none"
          style={{ position:"absolute", bottom:-1, left:0, right:0, width:"100%", display:"block" }}>
          <path d="M0 0 Q120 18 240 9 Q360 0 480 14 L480 18 L0 18 Z" fill={G.bg} />
        </svg>
      </div>

      {/* ── FEATURES ─────────────────────────────────── */}
      <div style={{ padding:"24px 18px 0", flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:"1px", textTransform:"uppercase", color:G.faint }}>
            Features
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <MapPin size={11} color={G.faint} />
            <span style={{ fontSize:11, fontWeight:600, color:G.faint }}>Delhi NCR</span>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {features.map((f, i) => (
            <Link
              key={f.href}
              href={f.href}
              style={{
                display:"flex", alignItems:"center", gap:16,
                padding:"16px 16px",
                borderRadius:20,
                background:G.surface,
                border:`1px solid ${G.line}`,
                textDecoration:"none",
                boxShadow:"0 2px 4px rgba(5,22,14,.05), 0 10px 28px -8px rgba(5,22,14,.14)",
                animation:`rk-fadeUp .4s ${0.06 + i * 0.06}s both`,
                borderLeft:`3px solid ${f.accent}`,
              }}
            >
              <div style={{
                width:44, height:44, borderRadius:13, flexShrink:0,
                background:f.accentBg,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <f.Icon size={21} color={f.accent} strokeWidth={2} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:800, fontSize:16, color:G.ink, letterSpacing:"-.2px" }}>
                  {f.label}
                </div>
                <div style={{ fontSize:12.5, color:G.muted, marginTop:2 }}>{f.desc}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                <span style={{ fontSize:10, fontWeight:700, color:f.tagColor, background:f.accentBg, padding:"2px 8px", borderRadius:6, letterSpacing:".3px", textTransform:"uppercase" }}>
                  {f.tag}
                </span>
                <ChevronRight size={15} color={G.faint} />
              </div>
            </Link>
          ))}
        </div>

        {/* Quick tip */}
        <div style={{ marginTop:16, padding:"12px 16px", borderRadius:14, background:"rgba(10,144,96,.07)", border:"1px solid rgba(10,144,96,.15)", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:G.green, flexShrink:0, animation:"rk-pulse 2s infinite" }} />
          <p style={{ margin:0, fontSize:12.5, color:G.muted, lineHeight:1.5 }}>
            Updated with live surge data · IPL season · Delhi NCR
          </p>
        </div>
      </div>

      <div style={{ height:16 }} />
    </div>
  );
}
