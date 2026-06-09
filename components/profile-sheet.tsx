"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Edit3, RotateCcw, Check, ChevronDown } from "lucide-react";
import { useUI } from "@/lib/ui-context";
import { useProfile } from "@/lib/ridekamao-profile";
import { PROFESSIONS, LANGUAGES } from "@/lib/ridekamao-data";

const G = {
  green: "#0A9060", green700: "#045234", green50: "#D8F5E8", green100: "#B4EAD0",
  ink: "#05160E", ink2: "#163022", muted: "#456055", faint: "#7A9A8A",
  line: "#BDD8C8", surface: "#FFFFFF", bg: "#EBF7F1",
  red: "#B83030", redBg: "#FCEAEA",
};

export function ProfileSheet() {
  const { profileOpen, closeProfile } = useUI();
  const { profile, setProfile, clearProfile } = useProfile();
  const router = useRouter();
  const [showLangPicker, setShowLangPicker] = useState(false);

  const profession = PROFESSIONS.find((p) => p.id === profile?.profession);
  const currentLang = LANGUAGES.find((l) => l.id === profile?.language);

  const handleChangeLang = (langId: string) => {
    if (!profile) return;
    setProfile({ ...profile, language: langId });
    setShowLangPicker(false);
  };

  const handleEdit = () => {
    closeProfile();
    router.push("/onboarding");
  };

  const handleReset = () => {
    clearProfile();
    closeProfile();
    router.push("/onboarding");
  };

  if (!profileOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => { setShowLangPicker(false); closeProfile(); }}
        style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(5,22,14,.55)", animation: "rk-fadeIn .2s both" }}
      />

      {/* Sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, zIndex: 51,
        background: G.surface, borderRadius: "24px 24px 0 0",
        boxShadow: "0 -8px 40px -8px rgba(5,22,14,.25)",
        animation: "rk-slideUp .28s cubic-bezier(.34,1.3,.64,1) both",
        paddingBottom: "env(safe-area-inset-bottom)",
        maxHeight: "92dvh", overflowY: "auto",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: G.line }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 10px" }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 20, color: G.ink }}>
            {profile ? "Your Profile" : "Set Up Profile"}
          </h2>
          <button onClick={closeProfile} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${G.line}`, background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={18} color={G.muted} />
          </button>
        </div>

        {profile ? (
          <>
            {/* Avatar row */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 20px 18px" }}>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: "linear-gradient(150deg,#0B6B48,#064D33)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 18, textTransform: "uppercase" }}>{profile.name.slice(0, 1)}</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: G.ink }}>{profile.name}</div>
                <div style={{ fontSize: 13, color: G.muted, marginTop: 1 }}>{profile.email}</div>
              </div>
            </div>

            <div style={{ margin: "0 20px", height: 1, background: G.line }} />

            {/* Profession — read-only */}
            <div style={{ padding: "13px 20px", borderBottom: `1px solid ${G.line}` }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".8px", color: G.faint, marginBottom: 3 }}>Profession</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: G.ink }}>{profession?.title ?? "—"}</div>
            </div>

            {/* Language — inline picker */}
            <div style={{ borderBottom: `1px solid ${G.line}` }}>
              <button
                onClick={() => setShowLangPicker((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "13px 20px", background: "none", border: "none",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".8px", color: G.faint, marginBottom: 3 }}>Language</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: G.ink }}>
                    {currentLang?.native ?? "—"}
                    <span style={{ fontSize: 12.5, color: G.muted, marginLeft: 8 }}>{currentLang?.label}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: G.green, background: G.green50, padding: "2px 8px", borderRadius: 6 }}>Change</span>
                  <ChevronDown size={15} color={G.faint} style={{ transform: showLangPicker ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                </div>
              </button>

              {showLangPicker && (
                <div style={{ padding: "4px 16px 14px", animation: "rk-fadeUp .2s both" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {LANGUAGES.map((l) => {
                      const active = profile.language === l.id;
                      return (
                        <button
                          key={l.id}
                          onClick={() => handleChangeLang(l.id)}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "10px 12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                            background: active ? G.green50 : G.bg,
                            border: `1.5px solid ${active ? G.green : G.line}`,
                            transition: "all .15s",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: G.ink, fontFamily: l.id === "en" ? "inherit" : "'Noto Sans Devanagari', sans-serif" }}>
                              {l.native}
                            </div>
                            <div style={{ fontSize: 11, color: active ? G.green700 : G.faint, fontWeight: 600 }}>{l.label}</div>
                          </div>
                          {active && <Check size={14} color={G.green} strokeWidth={2.5} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Weekly target */}
            <div style={{ padding: "13px 20px", borderBottom: `1px solid ${G.line}` }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".8px", color: G.faint, marginBottom: 3 }}>Weekly Target</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: G.ink }}>₹{profile.weeklyTarget.toLocaleString("en-IN")} / week</div>
            </div>

            {/* Goals */}
            <div style={{ padding: "13px 20px", borderBottom: `1px solid ${G.line}` }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".8px", color: G.faint, marginBottom: 3 }}>Goals</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {profile.goals.map((g) => (
                  <span key={g} style={{ fontSize: 12.5, fontWeight: 600, color: G.green700, background: G.green50, padding: "3px 10px", borderRadius: 8 }}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: "18px 20px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handleEdit}
                style={{ width: "100%", height: 50, borderRadius: 14, border: `1.5px solid ${G.green}`, background: G.green50, color: G.green700, fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Edit3 size={17} /> Edit all preferences
              </button>
              <button
                onClick={handleReset}
                style={{ width: "100%", height: 50, borderRadius: 14, border: `1.5px solid ${G.line}`, background: "transparent", color: G.red, fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <RotateCcw size={16} /> Reset &amp; start over
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: "20px 20px 28px" }}>
            <p style={{ fontSize: 15, color: G.muted, lineHeight: 1.6, margin: "0 0 20px" }}>
              Set up your rider profile to get personalised shift plans, location-based surge alerts, and earnings projections.
            </p>
            <button
              onClick={handleEdit}
              style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: "linear-gradient(180deg,#0B6B48,#064D33)", color: "#fff", fontWeight: 700, fontSize: 15.5, cursor: "pointer", boxShadow: "0 12px 24px -10px rgba(5,80,50,.5)" }}
            >
              Get started
            </button>
          </div>
        )}
      </div>
    </>
  );
}
