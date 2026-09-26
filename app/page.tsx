"use client";

import Link from "next/link";
import { useProfile } from "@/lib/ridekamao-profile";
import { useUI } from "@/lib/ui-context";
import { useT, useLang, profTitle } from "@/lib/i18n";
import { ArrowRight, Clock, Thermometer, Shield, MapPin, ChevronRight, Navigation, Sparkles } from "lucide-react";
import { SpreadActions } from "@/components/spread-actions";

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
    labelKey: "home.f.shift" as const,
    descKey: "home.f.shiftDesc" as const,
    Icon: Clock,
    accent: G.green,
    accentBg: G.green50,
    tagKey: "home.f.shiftTag" as const,
    tagColor: G.green,
  },
  {
    href: "/heat",
    labelKey: "home.f.heat" as const,
    descKey: "home.f.heatDesc" as const,
    Icon: Thermometer,
    accent: "#B85000",
    accentBg: "#FFE8D0",
    tagKey: "home.f.heatTag" as const,
    tagColor: "#B85000",
  },
  {
    href: "/rights",
    labelKey: "home.f.rights" as const,
    descKey: "home.f.rightsDesc" as const,
    Icon: Shield,
    accent: "#1A4FCC",
    accentBg: "#E0EAFF",
    tagKey: "home.f.rightsTag" as const,
    tagColor: "#1A4FCC",
  },
];

export default function HomePage() {
  const { profile, loading } = useProfile();
  const { openProfile } = useUI();
  const t = useT();
  const lang = useLang();

  const hour = new Date().getHours();
  const greetKey = hour < 12 ? "home.goodMorning" : hour < 17 ? "home.goodAfternoon" : "home.goodEvening";

  return (
    <div style={{ background: G.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>

      {/* ── HERO ─────────────────────────────────────── */}
      <div
        className="road-texture"
        style={{
          background: "linear-gradient(150deg, #07563A 0%, #03442F 58%, #032D1E 100%)",
          padding: "36px 24px 42px",
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial glow spots */}
        <div style={{ position:"absolute", top:-80, right:-60, width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle, rgba(10,144,96,.35), transparent 65%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-60, left:-30, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle, rgba(6,107,71,.3), transparent 65%)", pointerEvents:"none" }} />

        {/* Top row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:46, position:"relative" }}>
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
                {t(greetKey)}
              </div>
              <h1 style={{ margin:"0 0 6px", fontWeight:800, fontSize:34, letterSpacing:"-1.2px", color:"#fff", lineHeight:1.06 }}>
                {profile.name}
              </h1>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:22 }}>
                <div style={{ padding:"4px 12px", borderRadius:100, background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.18)" }}>
                  <span style={{ color:"rgba(255,255,255,.85)", fontSize:12.5, fontWeight:600 }}>
                    {profTitle(profile.profession, lang)} · {t("common.ncr")}
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
                {t("home.viewPlan")}
                <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <>
              <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"7px 11px", borderRadius:100, background:"rgba(93,235,176,.12)", border:"1px solid rgba(93,235,176,.28)", color:"#AFF4D4", fontSize:11, fontWeight:800, letterSpacing:".8px", textTransform:"uppercase", marginBottom:20 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#5DEBB0" }} />
                {t("home.kicker")}
              </div>
              <h1 style={{ margin:"0 0 16px", fontWeight:800, fontSize:"clamp(38px, 10vw, 48px)", letterSpacing:"-2px", color:"#fff", lineHeight:1.08 }}>
                {t("home.heroTitle1")}<br/>
                <span style={{ color:"#5DEBB0" }}>{t("home.heroTitle2")}</span>
              </h1>
              <p style={{ margin:"0 0 26px", fontSize:15, color:"rgba(255,255,255,.82)", lineHeight:1.6, maxWidth:305 }}>
                {t("home.heroSub")}
              </p>
              <Link
                href="/onboarding"
                style={{
                  display:"inline-flex", alignItems:"center", justifyContent:"space-between", gap:30,
                  minHeight:54, padding:"14px 20px", borderRadius:14,
                  background:"#fff", color:G.green700,
                  fontWeight:800, fontSize:15, textDecoration:"none",
                  boxShadow:"0 8px 24px rgba(0,0,0,.19)",
                }}
              >
                {t("home.cta")}
                <ArrowRight size={18} />
              </Link>
              <div style={{ display:"flex", alignItems:"center", gap:9, marginTop:30, color:"rgba(255,255,255,.68)", fontSize:11.5, fontWeight:600 }}>
                <Navigation size={15} color="#5DEBB0" />
                {t("home.gpsNote")}
              </div>
            </>
          )}
        </div>

        {/* Bottom wave trim */}
        <svg viewBox="0 0 480 18" preserveAspectRatio="none"
          style={{ position:"absolute", bottom:-1, left:0, right:0, width:"100%", display:"block" }}>
          <path d="M0 0 Q120 18 240 9 Q360 0 480 14 L480 18 L0 18 Z" fill={G.bg} />
        </svg>
      </div>

      {!loading && !profile && (
        <section style={{ margin:"-1px 0 0", padding:"27px 22px 8px", background:G.bg, fontFamily:"var(--font-jakarta), system-ui, sans-serif" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12, color:G.greenDark, fontSize:11, fontWeight:800, letterSpacing:"1px", textTransform:"uppercase" }}>
            <Sparkles size={14} /> {t("home.howTitle")}
          </div>
          <h2 style={{ margin:"0 0 20px", fontSize:22, lineHeight:1.23, letterSpacing:"-.7px", fontWeight:800, color:G.ink }}>{t("home.howHeading")}</h2>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ background:G.surface, border:`1px solid ${G.line}`, borderRadius:17, padding:"15px 14px 18px", minWidth:0 }}>
              <div style={{ width:30, height:30, display:"grid", placeItems:"center", borderRadius:9, background:G.green50, color:G.greenDark, fontSize:12, fontWeight:800, marginBottom:15 }}>01</div>
              <div style={{ fontWeight:800, fontSize:14, color:G.ink, marginBottom:5 }}>{t("home.stepOne")}</div>
              <p style={{ margin:0, fontSize:12, lineHeight:1.5, color:G.muted }}>{t("home.stepOneDesc")}</p>
            </div>
            <div style={{ background:G.surface, border:`1px solid ${G.line}`, borderRadius:17, padding:"15px 14px 18px", minWidth:0 }}>
              <div style={{ width:30, height:30, display:"grid", placeItems:"center", borderRadius:9, background:G.green50, color:G.greenDark, fontSize:12, fontWeight:800, marginBottom:15 }}>02</div>
              <div style={{ fontWeight:800, fontSize:14, color:G.ink, marginBottom:5 }}>{t("home.stepTwo")}</div>
              <p style={{ margin:0, fontSize:12, lineHeight:1.5, color:G.muted }}>{t("home.stepTwoDesc")}</p>
            </div>
          </div>
          <p style={{ margin:"12px 1px 0", fontSize:11, color:G.muted, lineHeight:1.5 }}>{t("home.dataNote")}</p>
        </section>
      )}

      {/* ── FEATURES ─────────────────────────────────── */}
      <div style={{ padding:"24px 18px 0", flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:"1px", textTransform:"uppercase", color:G.faint }}>
            {t("home.features")}
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <MapPin size={11} color={G.faint} />
            <span style={{ fontSize:11, fontWeight:600, color:G.faint }}>{t("common.ncr")}</span>
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
                  {t(f.labelKey)}
                </div>
                <div style={{ fontSize:12.5, color:G.muted, marginTop:2 }}>{t(f.descKey)}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                <span style={{ fontSize:10, fontWeight:700, color:f.tagColor, background:f.accentBg, padding:"2px 8px", borderRadius:6, letterSpacing:".3px", textTransform:"uppercase" }}>
                  {t(f.tagKey)}
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
            {t("home.tip")}
          </p>
        </div>
      </div>

      {/* Share + install */}
      <SpreadActions />

      <div style={{ height:16 }} />
    </div>
  );
}
