"use client";

import { useRouter } from "next/navigation";
import { X, Edit3, RotateCcw, ChevronRight } from "lucide-react";
import { useUI } from "@/lib/ui-context";
import { useProfile } from "@/lib/ridekamao-profile";
import { PROFESSIONS, LANGUAGES } from "@/lib/ridekamao-data";

const G = {
  green: "#0C9267", green700: "#056B4A", green50: "#DFF5EB",
  ink: "#0A1812", ink2: "#1F3028", muted: "#506058", faint: "#7A9088",
  line: "#C8DFCF", surface: "#FFFFFF", bg: "#E8F5EE",
  red: "#C93B35", redBg: "#FDE8E7", redInk: "#7A1F1B",
};

function Row({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%",
        padding: "14px 20px", background: "none", border: "none",
        borderBottom: `1px solid ${G.line}`, cursor: onClick ? "pointer" : "default",
        textAlign: "left",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", color: G.faint, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: G.ink, truncate: true }}>{value}</div>
      </div>
      {onClick && <ChevronRight size={16} color={G.faint} />}
    </button>
  );
}

export function ProfileSheet() {
  const { profileOpen, closeProfile } = useUI();
  const { profile, clearProfile } = useProfile();
  const router = useRouter();

  const profession = PROFESSIONS.find((p) => p.id === profile?.profession);
  const language = LANGUAGES.find((l) => l.id === profile?.language);

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
        onClick={closeProfile}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(10,24,18,.55)",
          animation: "rk-fadeIn .2s both",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          zIndex: 51,
          background: G.surface,
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -8px 40px -8px rgba(10,24,18,.25)",
          animation: "rk-slideUp .28s cubic-bezier(.34,1.3,.64,1) both",
          paddingBottom: "env(safe-area-inset-bottom)",
          maxHeight: "92dvh",
          overflowY: "auto",
        }}
      >
        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: G.line }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 8px" }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 20, color: G.ink }}>
            {profile ? "Your Profile" : "Set Up Profile"}
          </h2>
          <button
            onClick={closeProfile}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${G.line}`, background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <X size={18} color={G.muted} />
          </button>
        </div>

        {profile ? (
          <>
            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px 20px" }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(160deg,#13A878,#0B8C63)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 18, textTransform: "uppercase" }}>
                  {profile.name.slice(0, 1)}
                </span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: G.ink }}>{profile.name}</div>
                <div style={{ fontSize: 13, color: G.muted, marginTop: 2 }}>{profile.email}</div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ margin: "0 20px", height: 1, background: G.line }} />

            {/* Details */}
            <Row label="Profession" value={profession?.title ?? "—"} />
            <Row label="Language" value={language?.label ?? "—"} />
            <Row
              label="Weekly Target"
              value={`₹${profile.weeklyTarget.toLocaleString("en-IN")} / week`}
            />
            <Row
              label="Goals"
              value={profile.goals.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(", ")}
            />

            {/* Actions */}
            <div style={{ padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handleEdit}
                style={{
                  width: "100%", height: 50, borderRadius: 14, border: `1.5px solid ${G.green}`,
                  background: G.green50, color: G.green700, fontWeight: 700, fontSize: 15,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Edit3 size={17} /> Edit preferences
              </button>
              <button
                onClick={handleReset}
                style={{
                  width: "100%", height: 50, borderRadius: 14, border: `1.5px solid ${G.line}`,
                  background: "transparent", color: G.red, fontWeight: 700, fontSize: 15,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <RotateCcw size={16} /> Reset profile
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
              style={{
                width: "100%", height: 52, borderRadius: 14, border: "none",
                background: "linear-gradient(180deg,#13A878,#0A8460)",
                color: "#fff", fontWeight: 700, fontSize: 15.5,
                cursor: "pointer",
                boxShadow: "0 12px 24px -10px rgba(10,140,95,.6)",
              }}
            >
              Get started
            </button>
          </div>
        )}
      </div>
    </>
  );
}
