"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ChevronLeft } from "lucide-react";
import { useProfile } from "@/lib/ridekamao-profile";
import { LANGUAGES, PROFESSIONS, GOALS } from "@/lib/ridekamao-data";
import { saveProfile } from "@/lib/supabase-events";
import type { RideKamaoProfile } from "@/lib/ridekamao-data";

const G = {
  green: "#0C9267", green700: "#056B4A", green600: "#0A8460",
  green50: "#DFF5EB", green100: "#C0EDD8",
  ink: "#0A1812", ink2: "#1F3028", muted: "#506058", faint: "#7A9088",
  line: "#C8DFCF", surface: "#FFFFFF", bg: "#E8F5EE",
};

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 5, flex: 1 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ height: 4, borderRadius: 2, flex: i === step ? 2.2 : 1, background: i <= step ? G.green : G.line, transition: "all .35s cubic-bezier(.4,0,.2,1)" }} />
      ))}
    </div>
  );
}

function SelectCard({ title, sub, selected, onClick, multi }: {
  title: string; sub?: string; selected: boolean; onClick: () => void; multi?: boolean;
}) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 16, marginBottom: 10, background: G.surface, border: `2px solid ${selected ? G.green : G.line}`, boxShadow: selected ? "0 8px 20px -12px rgba(12,146,103,.4)" : "0 1px 3px rgba(10,24,18,.06)", transition: "all .16s", cursor: "pointer" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: G.ink, lineHeight: 1.25 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: G.muted, marginTop: 3 }}>{sub}</div>}
      </div>
      <div style={{ width: 22, height: 22, borderRadius: multi ? 7 : "50%", flexShrink: 0, border: `2px solid ${selected ? G.green : G.line}`, background: selected ? G.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .16s" }}>
        {selected && <Check size={13} color="#fff" strokeWidth={3} />}
      </div>
    </button>
  );
}

function PrimaryBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", height: 52, borderRadius: 16, border: "none", cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#B8D8CC" : "linear-gradient(180deg,#13A878,#0A8460)", color: "#fff", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: disabled ? "none" : "0 10px 22px -8px rgba(10,140,95,.55)", transition: "all .18s" }}>
      {children}
    </button>
  );
}

function FieldInput({ label, placeholder, value, onChange, type = "text" }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontWeight: 700, fontSize: 12, color: G.ink2, marginBottom: 7, marginLeft: 2, textTransform: "uppercase", letterSpacing: ".6px" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", padding: "0 16px", height: 52, background: G.surface, borderRadius: 14, border: `2px solid ${focus ? G.green : G.line}`, transition: "border .18s", boxShadow: focus ? "0 8px 20px -14px rgba(12,146,103,.45)" : "none" }}>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} style={{ flex: 1, border: "none", outline: "none", fontSize: 15.5, color: G.ink, background: "transparent", fontWeight: 500 }} />
      </div>
    </div>
  );
}

function GeneratingScreen({ onDone }: { onDone: () => void }) {
  const items = ["Reading today's Delhi NCR weather & AQI", "Scanning local events — IPL, festivals", "Matching surge history to your zone", "Building your personalised shift plan"];
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done < items.length) {
      const t = setTimeout(() => setDone((d) => d + 1), 680);
      return () => clearTimeout(t);
    }
    const t = setTimeout(onDone, 600);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", background: "linear-gradient(170deg,#EEF9F4,#DFF0E8)" }}>
      <div style={{ width: 76, height: 76, borderRadius: 24, marginBottom: 28, background: "linear-gradient(160deg,#13A878,#0A8460)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 18px 36px -14px rgba(10,140,95,.6)", animation: "rk-pop .5s both", position: "relative" }}>
        <ArrowRight size={34} color="#fff" strokeWidth={2.5} />
        <div style={{ position: "absolute", inset: -6, borderRadius: 28, border: `2px solid ${G.green}`, opacity: .3, animation: "rk-pulse 1.4s infinite" }} />
      </div>
      <h2 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 22, letterSpacing: "-.4px", color: G.ink }}>Building your plan…</h2>
      <p style={{ margin: "0 0 28px", fontSize: 13.5, color: G.muted }}>Just a few seconds</p>
      <div style={{ width: "100%", maxWidth: 320 }}>
        {items.map((item, i) => {
          const fin = i < done, cur = i === done;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", opacity: i <= done ? 1 : 0.38, transition: "opacity .3s" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: fin ? G.green : "transparent", border: fin ? "none" : `2px solid ${cur ? G.green : G.line}` }}>
                {fin ? <Check size={13} color="#fff" strokeWidth={3} /> : cur ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: G.green, animation: "rk-pulse 1s infinite" }} /> : null}
              </div>
              <span style={{ fontSize: 13.5, fontWeight: fin ? 600 : 500, color: fin ? G.ink : G.muted }}>{item}</span>
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
  const [target, setTarget] = useState(10000);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (profile) { setLang(profile.language); setProf(profile.profession); setGoals(profile.goals); setName(profile.name); setEmail(profile.email); setTarget(profile.weeklyTarget); }
  }, []);

  const toggleGoal = (id: string) => setGoals((g) => g.includes(id) ? g.filter((x) => x !== id) : [...g, id]);

  const handleFinish = () => {
    const p: RideKamaoProfile = { language: lang, profession: prof!, goals, name: name.trim() || "Saathi", email, weeklyTarget: target };
    setProfile(p);
    saveProfile(p);
    router.push("/shifts");
  };

  if (generating) return <GeneratingScreen onDone={handleFinish} />;

  const pageWrap: React.CSSProperties = { minHeight: "100dvh", background: G.bg };

  return (
    <div style={pageWrap}>
      <AnimatePresence mode="wait">
        {/* ── Step 0: Language splash ── */}
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ padding: "52px 24px 0" }}>
              <div style={{ borderRadius: 24, padding: "28px 22px 26px", marginBottom: 28, background: "linear-gradient(160deg,#0FA080,#067352 80%)", position: "relative", overflow: "hidden", boxShadow: "0 22px 48px -24px rgba(6,115,82,.6)" }}>
                <div style={{ position: "absolute", top: -40, right: -30, width: 170, height: 170, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.18), transparent 65%)", pointerEvents: "none" }} />
                <p style={{ margin: "0 0 22px", fontWeight: 800, fontSize: 24, color: "#fff", letterSpacing: "-.5px" }}>
                  Ride<span style={{ color: "#9BF0CE" }}>Kamao</span>
                </p>
                <h1 style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 28, lineHeight: 1.1, letterSpacing: "-.8px", color: "#fff" }}>
                  Ride smart,<br />earn more.
                </h1>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,.82)", fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  राइड करो · कमाओ · आगे बढ़ो
                </p>
              </div>

              <p style={{ fontWeight: 700, fontSize: 11.5, letterSpacing: ".9px", textTransform: "uppercase", color: G.faint, marginBottom: 12 }}>Choose your language · भाषा</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
                {LANGUAGES.map((l) => {
                  const on = lang === l.id;
                  return (
                    <button key={l.id} onClick={() => setLang(l.id)} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "12px 14px", borderRadius: 14, textAlign: "left", cursor: "pointer", background: on ? G.surface : G.bg, border: `2px solid ${on ? G.green : G.line}`, transition: "all .16s" }}>
                      <span style={{ fontWeight: 700, fontSize: 18, color: G.ink, fontFamily: l.id === "en" ? "inherit" : "'Noto Sans Devanagari', sans-serif" }}>{l.native}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: on ? G.green700 : G.faint }}>{l.label}</span>
                    </button>
                  );
                })}
              </div>
              <PrimaryBtn onClick={() => setStep(1)}>Get started <ArrowRight size={18} /></PrimaryBtn>
            </div>
          </motion.div>
        )}

        {/* ── Steps 1–3 ── */}
        {step >= 1 && step <= 3 && (
          <motion.div key={`s${step}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Sticky top bar */}
            <div style={{ position: "sticky", top: 0, zIndex: 20, background: G.bg, padding: "18px 20px 12px", display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setStep((s) => Math.max(0, s - 1))} style={{ width: 38, height: 38, borderRadius: 11, background: G.surface, border: `1px solid ${G.line}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <ChevronLeft size={20} color={G.ink} />
              </button>
              <ProgressBar step={step - 1} total={3} />
              <span style={{ fontWeight: 700, fontSize: 13, color: G.faint, flexShrink: 0 }}>{step}/3</span>
            </div>

            <div style={{ padding: "4px 20px 28px" }}>
              {step === 1 && (
                <>
                  <p style={{ fontWeight: 700, fontSize: 11.5, letterSpacing: "1px", textTransform: "uppercase", color: G.green, marginBottom: 6 }}>Step 1</p>
                  <h1 style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 24, letterSpacing: "-.5px", color: G.ink }}>What do you ride?</h1>
                  <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.5, color: G.muted }}>We tune every recommendation to how you earn.</p>
                  {PROFESSIONS.map((p) => (
                    <SelectCard key={p.id} title={p.title} sub={p.sub} selected={prof === p.id} onClick={() => setProf(p.id)} />
                  ))}
                  <PrimaryBtn onClick={() => setStep(2)} disabled={!prof}>Continue <ArrowRight size={18} /></PrimaryBtn>
                </>
              )}

              {step === 2 && (
                <>
                  <p style={{ fontWeight: 700, fontSize: 11.5, letterSpacing: "1px", textTransform: "uppercase", color: G.green, marginBottom: 6 }}>Step 2</p>
                  <h1 style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 24, letterSpacing: "-.5px", color: G.ink }}>What matters most?</h1>
                  <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.5, color: G.muted }}>Pick any that fit — your plan is built around these.</p>
                  {GOALS.map((g) => (
                    <SelectCard key={g.id} title={g.title} sub={g.sub} multi selected={goals.includes(g.id)} onClick={() => toggleGoal(g.id)} />
                  ))}
                  <PrimaryBtn onClick={() => setStep(3)} disabled={goals.length === 0}>Continue <ArrowRight size={18} /></PrimaryBtn>
                </>
              )}

              {step === 3 && (
                <>
                  <p style={{ fontWeight: 700, fontSize: 11.5, letterSpacing: "1px", textTransform: "uppercase", color: G.green, marginBottom: 6 }}>Step 3</p>
                  <h1 style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 24, letterSpacing: "-.5px", color: G.ink }}>Your details</h1>
                  <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.5, color: G.muted }}>Your daily plan and earnings report — straight to your inbox each morning.</p>
                  <FieldInput label="Your name" placeholder="e.g. Ramesh Kumar" value={name} onChange={setName} />
                  <FieldInput label="Email" placeholder="you@email.com" value={email} onChange={setEmail} type="email" />

                  {goals.includes("target") && (
                    <div style={{ marginBottom: 20, padding: "16px", background: G.surface, borderRadius: 16, border: `2px solid ${G.green}`, boxShadow: "0 1px 3px rgba(10,24,18,.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: G.ink2 }}>Weekly income target</span>
                        <span style={{ fontWeight: 800, fontSize: 22, color: G.green700, letterSpacing: "-.5px", fontVariantNumeric: "tabular-nums" }}>₹{target.toLocaleString("en-IN")}</span>
                      </div>
                      <input type="range" min={4000} max={25000} step={500} value={target} onChange={(e) => setTarget(+e.target.value)} style={{ width: "100%", accentColor: G.green, height: 5 }} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11.5, color: G.faint }}>
                        <span>₹4,000</span><span>₹25,000</span>
                      </div>
                    </div>
                  )}

                  <PrimaryBtn onClick={() => setGenerating(true)} disabled={!/.+@.+\..+/.test(email)}>
                    Build my plan <ArrowRight size={18} />
                  </PrimaryBtn>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
