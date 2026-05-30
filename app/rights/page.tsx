"use client";

import { useState, useEffect, useRef } from "react";
import { KYR_INTRO, KYR_QUESTIONS } from "@/lib/ridekamao-data";
import type { RightsQA } from "@/lib/ridekamao-data";

const G = {
  ink: "#0C1A14", ink2: "#27352E", muted: "#5E6E66", faint: "#8A9A92",
  line: "#E3EAE6", line2: "#EEF3F0", surface: "#FFFFFF", bg: "#E7EEEA",
  green: "#0E9A6E", green50: "#E8F6EF", green100: "#D2EEE0", green700: "#057A55",
};

interface ChatMessage {
  from: "user" | "bot";
  text: string;
  cites?: string[];
}

function Bubble({ m }: { m: ChatMessage }) {
  const isUser = m.from === "user";
  return (
    <div
      style={{
        display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 9, animation: "rk-fadeUp .3s both",
        paddingLeft: isUser ? 40 : 0, paddingRight: isUser ? 0 : 40,
      }}
    >
      <div
        style={{
          maxWidth: "100%",
          background: isUser ? "linear-gradient(160deg,#13A878,#0B8C63)" : G.surface,
          color: isUser ? "#fff" : G.ink,
          borderRadius: isUser ? "16px 16px 5px 16px" : "16px 16px 16px 5px",
          padding: "11px 13px",
          border: isUser ? "none" : `1px solid ${G.line}`,
          boxShadow: "0 2px 6px -3px rgba(12,26,20,.18)",
        }}
      >
        <p
          className="dvg"
          style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: isUser ? "#fff" : G.ink2 }}
        >
          {m.text}
        </p>
        {m.cites && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: .6, textTransform: "uppercase", color: G.faint, marginBottom: 4 }}>
              आधार · Sources
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {m.cites.map((c, j) => (
                <span
                  key={j}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "3px 8px", borderRadius: 7,
                    background: G.green50, border: `1px solid ${G.green100}`,
                    fontSize: 10.5, fontWeight: 700, color: G.green700,
                  }}
                >
                  📖 {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 9 }}>
      <div
        style={{
          background: G.surface, border: `1px solid ${G.line}`,
          borderRadius: "16px 16px 16px 5px", padding: "13px 15px",
          display: "flex", gap: 5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7, height: 7, borderRadius: "50%", background: G.faint, display: "inline-block",
              animation: `rk-blink 1.2s ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function RightsPage() {
  const [msgs, setMsgs] = useState<ChatMessage[]>([{ from: "bot", text: KYR_INTRO }]);
  const [typing, setTyping] = useState(false);
  const [asked, setAsked] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, typing]);

  const ask = (qObj: RightsQA) => {
    if (typing) return;
    setMsgs((m) => [...m, { from: "user", text: qObj.q }]);
    setAsked((a) => [...a, qObj.q]);
    setDraft("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "bot", text: qObj.a, cites: qObj.cites }]);
    }, 1300);
  };

  const sendDraft = () => {
    const text = draft.trim();
    if (!text || typing) return;
    const found = KYR_QUESTIONS.find((q) =>
      q.q.split(" ").some((w) => w.length > 2 && text.includes(w))
    );
    const fallback = KYR_QUESTIONS.find((q) => !asked.includes(q.q));
    ask(
      found || fallback || {
        q: text,
        a: "अच्छा सवाल! मैं इसे आपके राज्य के गिग वर्कर ग्रीवांस सेल को फॉरवर्ड कर रहा हूँ और प्रासंगिक कानून ढूँढ रहा हूँ। तब तक नीचे दिए सुझाए सवाल देखें।",
        cites: ["e-Shram Helpdesk · 14434"],
      }
    );
  };

  const remaining = KYR_QUESTIONS.filter((q) => !asked.includes(q.q));

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: G.bg }}>
      {/* Chat header */}
      <div
        style={{
          flexShrink: 0, padding: "20px 18px 14px",
          background: "linear-gradient(160deg,#0FA075,#067352)",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 6px 16px -10px rgba(6,115,82,.7)", zIndex: 5,
        }}
      >
        <div
          style={{
            width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(160deg,#13A878,#067352)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid rgba(255,255,255,.25)",
            boxShadow: "0 4px 10px -4px rgba(6,115,82,.6)",
            fontSize: 20,
          }}
        >
          🛡️
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="dvg" style={{ fontWeight: 800, fontSize: 17, color: "#fff", letterSpacing: "-.2px" }}>
            RideKamao साथी
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#9BF0CE", display: "inline-block" }} />
            <span className="dvg" style={{ fontSize: 11.5, color: "rgba(255,255,255,.85)", fontWeight: 600 }}>
              online · आपके हक़ का साथी
            </span>
          </div>
        </div>
        <div
          style={{
            width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,.15)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}
        >
          🛡️
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="noscroll"
        style={{
          flex: 1, overflowY: "auto", padding: "16px 14px 8px",
          backgroundImage: "radial-gradient(rgba(14,154,110,.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          minHeight: 0,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <span
            style={{
              fontSize: 10.5, fontWeight: 600, color: G.muted,
              background: "rgba(255,255,255,.7)", padding: "4px 11px", borderRadius: 8,
            }}
          >
            🔒 कानूनी जानकारी · निजी और सुरक्षित
          </span>
        </div>
        {msgs.map((m, i) => <Bubble key={i} m={m} />)}
        {typing && <TypingIndicator />}

        {!typing && remaining.length > 0 && (
          <div style={{ marginTop: 6, marginBottom: 4 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: .6, textTransform: "uppercase", color: G.faint, margin: "4px 2px 8px" }}>
              पूछें · Tap a question
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
              {remaining.slice(0, 3).map((q, i) => (
                <button
                  key={i}
                  onClick={() => ask(q)}
                  className="dvg"
                  style={{
                    textAlign: "left", padding: "10px 13px", borderRadius: "14px 14px 14px 5px",
                    background: G.surface, border: `1.5px solid ${G.green100}`,
                    fontSize: 13.5, fontWeight: 600, color: G.green700,
                    boxShadow: "0 1px 3px rgba(12,26,20,.08)", maxWidth: "90%",
                    cursor: "pointer",
                  }}
                >
                  {q.q}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ height: 4 }} />
      </div>

      {/* Input bar */}
      <div
        style={{
          flexShrink: 0, padding: "10px 12px 16px",
          background: G.surface, borderTop: `1px solid ${G.line}`,
          display: "flex", alignItems: "center", gap: 9,
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendDraft(); }}
          placeholder="अपना सवाल लिखें…"
          className="dvg"
          style={{
            flex: 1, height: 46, borderRadius: 23, border: `1.5px solid ${G.line}`,
            padding: "0 18px", fontSize: 14.5, outline: "none",
            background: G.bg, color: G.ink,
            fontFamily: "'Noto Sans Devanagari', sans-serif",
          }}
        />
        <button
          onClick={sendDraft}
          style={{
            width: 46, height: 46, borderRadius: "50%", flexShrink: 0, border: "none",
            background: "linear-gradient(160deg,#13A878,#0B8C63)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 14px -6px rgba(11,140,99,.7)", cursor: "pointer",
            fontSize: 18,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
