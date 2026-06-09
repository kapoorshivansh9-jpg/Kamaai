"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/ridekamao-profile";
import { useUI } from "@/lib/ui-context";
import { PROFESSIONS } from "@/lib/ridekamao-data";
import { ArrowRight, MapPin, Thermometer, Shield } from "lucide-react";

const G = {
  green: "#0C9267", green700: "#056B4A", green50: "#DFF5EB",
  ink: "#0A1812", ink2: "#1F3028", muted: "#506058", faint: "#7A9088",
  line: "#C8DFCF", surface: "#FFFFFF", bg: "#E8F5EE",
  amberBg: "#FEF0D6", amberInk: "#7A4400",
};

const features = [
  { icon: ArrowRight, label: "Shift Planner", desc: "Best windows to ride today", href: "/shifts", accent: G.green, accentBg: G.green50 },
  { icon: Thermometer, label: "Heat Safety",   desc: "AQI, fatigue & hydration points", href: "/heat",   accent: "#D45C00", accentBg: "#FFE8D4" },
  { icon: Shield,      label: "Know Your Rights", desc: "Legal help in your language", href: "/rights", accent: "#1E56D4", accentBg: "#DCE9FF" },
];

export default function HomePage() {
  const { profile, loading } = useProfile();
  const { openProfile } = useUI();
  const router = useRouter();

  const profession = profile ? PROFESSIONS.find((p) => p.id === profile.profession) : null;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ background: G.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>

      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(155deg,#0FA080,#067352 85%)",
          padding: "52px 24px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial glow */}
        <div style={{ position: "absolute", top: -60, right: -40, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.14), transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -20, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.08), transparent 65%)", pointerEvents: "none" }} />

        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, position: "relative" }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 22, color: "#fff", letterSpacing: "-.5px" }}>
              Ride<span style={{ color: "#9BF0CE" }}>Kamao</span>
            </span>
          </div>
          <button
            onClick={openProfile}
            style={{
              width: 38, height: 38, borderRadius: 12,
              background: "rgba(255,255,255,.18)", border: "1.5px solid rgba(255,255,255,.3)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            {profile ? (
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 14, textTransform: "uppercase" }}>
                {profile.name.slice(0, 1)}
              </span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M5.5 20.5a6.5 6.5 0 0 1 13 0"/>
              </svg>
            )}
          </button>
        </div>

        {/* Greeting */}
        <div style={{ animation: "rk-fadeUp .4s both" }}>
          {!loading && profile ? (
            <>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,.75)", fontWeight: 600, marginBottom: 4 }}>{greeting}</div>
              <h1 style={{ margin: 0, fontWeight: 800, fontSize: 30, letterSpacing: "-.8px", color: "#fff", lineHeight: 1.1 }}>
                {profile.name}
              </h1>
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ padding: "5px 12px", borderRadius: 100, background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)" }}>
                  <span style={{ color: "rgba(255,255,255,.9)", fontSize: 12.5, fontWeight: 600 }}>
                    {profession?.title ?? "Rider"} · Delhi NCR
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,.75)", fontWeight: 600, marginBottom: 6 }}>Welcome to</div>
              <h1 style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 32, letterSpacing: "-1px", color: "#fff", lineHeight: 1.08 }}>
                Ride smart.<br />Earn more.
              </h1>
              <p style={{ margin: 0, fontSize: 14.5, color: "rgba(255,255,255,.8)", lineHeight: 1.5, maxWidth: 260 }}>
                Smart shift plans for Delhi NCR gig workers — beat the heat and know your rights.
              </p>
            </>
          )}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 24, animation: "rk-fadeUp .4s .12s both" }}>
          {!loading && !profile ? (
            <Link
              href="/onboarding"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 20px", borderRadius: 14,
                background: "#fff", color: G.green700,
                fontWeight: 700, fontSize: 15, textDecoration: "none",
                boxShadow: "0 4px 16px rgba(0,0,0,.15)",
              }}
            >
              Get personalised plans
              <ArrowRight size={17} />
            </Link>
          ) : (
            <Link
              href="/shifts"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 20px", borderRadius: 14,
                background: "rgba(255,255,255,.18)", color: "#fff",
                border: "1.5px solid rgba(255,255,255,.3)",
                fontWeight: 700, fontSize: 15, textDecoration: "none",
              }}
            >
              View today's plan
              <ArrowRight size={17} />
            </Link>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".8px", textTransform: "uppercase", color: G.faint, marginBottom: 12 }}>
          Features
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {features.map((f, i) => (
            <div
              key={f.href}
              style={{ animation: `rk-fadeUp .4s ${0.1 + i * 0.07}s both` }}
            >
              <Link
                href={f.href}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px", borderRadius: 18,
                  background: G.surface, border: `1px solid ${G.line}`,
                  textDecoration: "none",
                  boxShadow: "0 1px 2px rgba(10,24,18,.05), 0 4px 16px -8px rgba(10,24,18,.12)",
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 13, background: f.accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <f.icon size={20} color={f.accent} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15.5, color: G.ink }}>{f.label}</div>
                  <div style={{ fontSize: 12.5, color: G.muted, marginTop: 2 }}>{f.desc}</div>
                </div>
                <ArrowRight size={16} color={G.faint} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Location badge */}
      <div style={{ padding: "20px 20px 8px", display: "flex", alignItems: "center", gap: 6 }}>
        <MapPin size={13} color={G.faint} />
        <span style={{ fontSize: 12, color: G.faint, fontWeight: 600 }}>Delhi NCR · Updated with local surge & weather</span>
      </div>
    </div>
  );
}
