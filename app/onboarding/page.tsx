"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/lib/ridekamao-profile";
import { LANGUAGES, PROFESSIONS, GOALS } from "@/lib/ridekamao-data";
import type { RideKamaoProfile } from "@/lib/ridekamao-data";

const GN = "#0E9A6E";
const GN700 = "#057A55";

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-2 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 5,
            borderRadius: 3,
            width: i === step ? 28 : 10,
            background: i <= step ? GN : "#E3EAE6",
            transition: "all .35s cubic-bezier(.4,0,.2,1)",
          }}
        />
      ))}
    </div>
  );
}

function SelectCard({
  icon, title, sub, selected, onClick, multi,
}: {
  icon: string; title: string; sub?: string;
  selected: boolean; onClick: () => void; multi?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14, width: "100%",
        textAlign: "left", padding: "15px", borderRadius: 16, marginBottom: 11,
        background: "#fff",
        border: `2px solid ${selected ? GN : "#E3EAE6"}`,
        boxShadow: selected ? "0 10px 24px -14px rgba(11,140,99,.45)" : "0 1px 3px rgba(12,26,20,.08)",
        transition: "all .18s", cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 46, height: 46, borderRadius: 13, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: selected ? "#E8F6EF" : "#EEF3F0",
          fontSize: 22, transition: "all .18s",
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15.5, color: "#0C1A14", lineHeight: 1.2 }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: "#5E6E66", marginTop: 3 }}>{sub}</div>}
      </div>
      <div
        style={{
          width: 22, height: 22, borderRadius: multi ? 7 : "50%", flexShrink: 0,
          border: `2px solid ${selected ? GN : "#E3EAE6"}`,
          background: selected ? GN : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .18s",
        }}
      >
        {selected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
      </div>
    </button>
  );
}

function PrimaryBtn({
  children, onClick, disabled,
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", height: 54, borderRadius: 16, border: "none", cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "#C4D8CE" : "linear-gradient(180deg,#13A878,#0B8C63)",
        color: "#fff", fontWeight: 700, fontSize: 16.5, display: "flex",
        alignItems: "center", justifyContent: "center", gap: 9,
        boxShadow: disabled ? "none" : "0 12px 24px -10px rgba(11,140,99,.6)",
        transition: "all .18s",
      }}
    >
      {children}
    </button>
  );
}

function FieldInput({
  icon, label, placeholder, value, onChange, type = "text",
}: {
  icon: string; label: string; placeholder: string;
  value: string; onChange: (v: string) => void; type?: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontWeight: 700, fontSize: 12.5, color: "#27352E", marginBottom: 7, marginLeft: 2 }}>
        {label}
      </label>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 11, padding: "0 15px", height: 54,
          background: "#fff", borderRadius: 14,
          border: `2px solid ${focus ? GN : "#E3EAE6"}`, transition: "border .18s",
          boxShadow: focus ? "0 8px 22px -14px rgba(11,140,99,.5)" : "none",
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1, border: "none", outline: "none", fontSize: 16, color: "#0C1A14",
            background: "transparent", fontWeight: 500,
          }}
        />
      </div>
    </div>
  );
}

function GeneratingScreen({ onDone }: { onDone: () => void }) {
  const items = [
    "Reading today's Delhi NCR weather & AQI",
    "Scanning local events — IPL, festivals, markets",
    "Matching 6 months of surge history to your zone",
    "Building your 3 best shift windows",
  ];
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done < items.length) {
      const t = setTimeout(() => setDone((d) => d + 1), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(onDone, 600);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "0 32px",
        background: "linear-gradient(170deg,#F3F9F6,#E5EEEA)",
      }}
    >
      <div
        style={{
          width: 78, height: 78, borderRadius: 24, marginBottom: 30, position: "relative",
          background: "linear-gradient(160deg,#13A878,#0B8C63)", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 20px 40px -16px rgba(11,140,99,.6)",
          animation: "rk-pop .5s both",
        }}
      >
        <span style={{ fontSize: 36 }}>✨</span>
        <div
          style={{
            position: "absolute", inset: -6, borderRadius: 28, border: `2px solid ${GN}`,
            opacity: .3, animation: "rk-pulse 1.4s infinite",
          }}
        />
      </div>
      <h2 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 22, letterSpacing: "-.4px", color: "#0C1A14" }}>
        Building your plan…
      </h2>
      <p style={{ margin: "0 0 28px", fontSize: 13.5, color: "#5E6E66" }}>Just a few seconds</p>
      <div style={{ width: "100%", maxWidth: 340 }}>
        {items.map((item, i) => {
          const fin = i < done;
          const cur = i === done;
          return (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                opacity: i <= done ? 1 : 0.4, transition: "opacity .3s",
              }}
            >
              <div
                style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: fin ? GN : "transparent",
                  border: fin ? "none" : `2px solid ${cur ? GN : "#E3EAE6"}`,
                }}
              >
                {fin
                  ? <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>
                  : cur
                    ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: GN, animation: "rk-pulse 1s infinite" }} />
                    : null}
              </div>
              <span style={{ fontSize: 14, fontWeight: fin ? 600 : 500, color: fin ? "#0C1A14" : "#5E6E66" }}>
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile, profile } = useProfile();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState("hi");
  const [prof, setProf] = useState<string | null>(null);
  const [goals, setGoals] = useState<string[]>(["earn", "heat"]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [target, setTarget] = useState(11000);
  const [generating, setGenerating] = useState(false);

  // Pre-fill if editing existing profile
  useEffect(() => {
    if (profile) {
      setLang(profile.language);
      setProf(profile.profession);
      setGoals(profile.goals);
      setName(profile.name);
      setEmail(profile.email);
      setTarget(profile.weeklyTarget);
    }
  }, []);

  const toggleGoal = (id: string) =>
    setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  const handleFinish = () => {
    const p: RideKamaoProfile = {
      language: lang,
      profession: prof!,
      goals,
      name: name.trim() || "Saathi",
      email,
      weeklyTarget: target,
    };
    setProfile(p);
    router.push("/shifts");
  };

  if (generating) {
    return <GeneratingScreen onDone={handleFinish} />;
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#EEF3F0",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  };
  const innerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 480,
    padding: "0 0 40px",
  };

  return (
    <div style={pageStyle}>
      <div style={innerStyle}>
        <AnimatePresence mode="wait">
          {/* ── Step 0: Splash + language ─────────────────── */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <div style={{ padding: "64px 24px 0" }}>
                <div
                  style={{
                    borderRadius: 24, padding: "26px 22px 24px", marginBottom: 28,
                    background: "linear-gradient(160deg,#0FA075,#067352 80%)",
                    position: "relative", overflow: "hidden",
                    boxShadow: "0 24px 50px -24px rgba(6,115,82,.6)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute", top: -40, right: -30, width: 170, height: 170,
                      borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.22), transparent 65%)",
                    }}
                  />
                  <p style={{ fontWeight: 800, fontSize: 25, color: "#fff", margin: 0, letterSpacing: "-.5px" }}>
                    Ride<span style={{ color: "#9BF0CE" }}>Kamao</span>
                  </p>
                  <h1 style={{ margin: "24px 0 0", fontWeight: 800, fontSize: 30, lineHeight: 1.08, letterSpacing: "-.9px", color: "#fff" }}>
                    Ride smart,<br />earn more every day.
                  </h1>
                  <p style={{ margin: "10px 0 0", fontSize: 14, color: "rgba(255,255,255,.85)", fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    राइड करो · कमाओ · आगे बढ़ो
                  </p>
                </div>

                <p style={{ fontWeight: 700, fontSize: 12.5, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A92", marginBottom: 12 }}>
                  Choose your language · भाषा
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
                  {LANGUAGES.map((l) => {
                    const on = lang === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => setLang(l.id)}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                          padding: "12px 14px", borderRadius: 14, textAlign: "left", cursor: "pointer",
                          background: on ? "#fff" : "#EEF3F0",
                          border: `2px solid ${on ? GN : "#E3EAE6"}`, transition: "all .16s",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700, fontSize: 18, color: "#0C1A14",
                            fontFamily: l.id === "en" ? "inherit" : "'Noto Sans Devanagari', sans-serif",
                          }}
                        >
                          {l.native}
                        </span>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: on ? GN700 : "#8A9A92" }}>{l.label}</span>
                      </button>
                    );
                  })}
                </div>
                <PrimaryBtn onClick={() => setStep(1)}>Get started →</PrimaryBtn>
              </div>
            </motion.div>
          )}

          {/* ── Steps 1–3 with top bar ─────────────────── */}
          {step >= 1 && step <= 3 && (
            <motion.div
              key={`step${step}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              {/* Top bar */}
              <div
                style={{
                  position: "sticky", top: 0, zIndex: 30, background: "#EEF3F0",
                  padding: "20px 24px 12px",
                  display: "flex", alignItems: "center", gap: 12,
                }}
              >
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: "#fff", border: "1px solid #E3EAE6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 18,
                  }}
                >
                  ←
                </button>
                <div style={{ flex: 1 }}><StepDots step={step - 1} total={3} /></div>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#8A9A92", flexShrink: 0 }}>
                  {step}/3
                </span>
              </div>

              <div style={{ padding: "8px 24px 24px" }}>
                {step === 1 && (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: GN, marginBottom: 8 }}>
                        Step 1 · You
                      </p>
                      <h1 style={{ margin: 0, fontWeight: 800, fontSize: 26, letterSpacing: "-.6px", color: "#0C1A14" }}>
                        What do you ride?
                      </h1>
                      <p style={{ margin: "9px 0 0", fontSize: 14.5, lineHeight: 1.5, color: "#5E6E66" }}>
                        We tune every recommendation to how you earn.
                      </p>
                    </div>
                    {PROFESSIONS.map((p) => (
                      <SelectCard
                        key={p.id} icon={p.icon} title={p.title} sub={p.sub}
                        selected={prof === p.id} onClick={() => setProf(p.id)}
                      />
                    ))}
                    <PrimaryBtn onClick={() => setStep(2)} disabled={!prof}>Continue →</PrimaryBtn>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: GN, marginBottom: 8 }}>
                        Step 2 · Goals
                      </p>
                      <h1 style={{ margin: 0, fontWeight: 800, fontSize: 26, letterSpacing: "-.6px", color: "#0C1A14" }}>
                        What matters most?
                      </h1>
                      <p style={{ margin: "9px 0 0", fontSize: 14.5, lineHeight: 1.5, color: "#5E6E66" }}>
                        Pick any that fit — your plan is built around these.
                      </p>
                    </div>
                    {GOALS.map((g) => (
                      <SelectCard
                        key={g.id} icon={g.icon} title={g.title} sub={g.sub} multi
                        selected={goals.includes(g.id)} onClick={() => toggleGoal(g.id)}
                      />
                    ))}
                    <PrimaryBtn onClick={() => setStep(3)} disabled={goals.length === 0}>Continue →</PrimaryBtn>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: GN, marginBottom: 8 }}>
                        Step 3 · Your plan
                      </p>
                      <h1 style={{ margin: 0, fontWeight: 800, fontSize: 26, letterSpacing: "-.6px", color: "#0C1A14" }}>
                        Where do we send it?
                      </h1>
                      <p style={{ margin: "9px 0 0", fontSize: 14.5, lineHeight: 1.5, color: "#5E6E66" }}>
                        Your daily shift plan and earnings report — straight to your inbox each morning.
                      </p>
                    </div>
                    <FieldInput icon="👤" label="Your name" placeholder="e.g. Ramesh" value={name} onChange={setName} />
                    <FieldInput icon="✉️" label="Email" placeholder="you@email.com" value={email} onChange={setEmail} type="email" />

                    {goals.includes("target") && (
                      <div
                        style={{
                          marginTop: 6, marginBottom: 16, padding: "16px", background: "#fff",
                          borderRadius: 16, border: `2px solid ${GN}`, boxShadow: "0 1px 3px rgba(12,26,20,.08)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#27352E" }}>🎯 Weekly income target</div>
                          <span style={{ fontWeight: 800, fontSize: 22, color: GN700, letterSpacing: "-.5px", fontVariantNumeric: "tabular-nums" }}>
                            ₹{target.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <input
                          type="range" min={4000} max={20000} step={500} value={target}
                          onChange={(e) => setTarget(+e.target.value)}
                          style={{ width: "100%", accentColor: GN, height: 6 }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11.5, color: "#8A9A92" }}>
                          <span>₹4k</span><span>₹20k</span>
                        </div>
                      </div>
                    )}
                    <PrimaryBtn
                      onClick={() => setGenerating(true)}
                      disabled={!/.+@.+\..+/.test(email)}
                    >
                      ✨ Build my plan
                    </PrimaryBtn>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
