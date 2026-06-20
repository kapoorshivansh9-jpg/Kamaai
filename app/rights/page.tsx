"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Shield, Info, Mic, Volume2, Landmark, ChevronRight } from "lucide-react";
import { getRightsContent } from "@/lib/ridekamao-data";
import { useProfile } from "@/lib/ridekamao-profile";
import { trackEvent } from "@/lib/supabase-events";
import { localeTag, tr } from "@/lib/i18n";
import type { RightsQA } from "@/lib/ridekamao-data";

// Minimal typing for the Web Speech API (not in the standard DOM lib).
interface SpeechRec {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void; onerror: () => void; start: () => void; stop: () => void;
}
type SpeechRecCtor = new () => SpeechRec;
function getSpeechRec(): SpeechRecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}
function speak(text: string, locale: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = locale;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

const G = {
  ink: "#0A1812", ink2: "#1F3028", muted: "#506058", faint: "#7A9088",
  line: "#C8DFCF", line2: "#E2F0E8", surface: "#FFFFFF", bg: "#E8F5EE",
  green: "#0C9267", green50: "#DFF5EB", green100: "#C0EDD8", green700: "#056B4A",
};

interface ChatMessage {
  from: "user" | "bot";
  text: string;
  cites?: string[];
}

function Bubble({ m, locale }: { m: ChatMessage; locale: string }) {
  const isUser = m.from === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 10, paddingLeft: isUser ? 44 : 0, paddingRight: isUser ? 0 : 44, animation: "rk-fadeUp .28s both" }}>
      <div style={{ background: isUser ? "linear-gradient(160deg,#13A878,#0A8460)" : G.surface, color: isUser ? "#fff" : G.ink, borderRadius: isUser ? "16px 16px 5px 16px" : "16px 16px 16px 5px", padding: "11px 14px", border: isUser ? "none" : `1px solid ${G.line}`, boxShadow: "0 2px 6px -3px rgba(10,24,18,.15)", maxWidth: "100%" }}>
        <p className="dvg" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: isUser ? "#fff" : G.ink2 }}>{m.text}</p>
        {!isUser && (
          <button onClick={() => speak(m.text, locale)} aria-label="Play" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 7, padding: "3px 8px", borderRadius: 7, background: G.green50, border: `1px solid ${G.green100}`, color: G.green700, fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}>
            <Volume2 size={12} /> ▶
          </button>
        )}
        {m.cites && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: .6, textTransform: "uppercase", color: isUser ? "rgba(255,255,255,.65)" : G.faint, marginBottom: 4 }}>Sources</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {m.cites.map((c, j) => (
                <span key={j} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 7, background: G.green50, border: `1px solid ${G.green100}`, fontSize: 10.5, fontWeight: 700, color: G.green700 }}>
                  <Info size={10} color={G.green700} /> {c}
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
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
      <div style={{ background: G.surface, border: `1px solid ${G.line}`, borderRadius: "16px 16px 16px 5px", padding: "13px 15px", display: "flex", gap: 5 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: G.faint, display: "inline-block", animation: `rk-blink 1.2s ${i * 0.18}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

export default function RightsPage() {
  const { profile } = useProfile();
  const lang = profile?.language ?? "en";
  const content = getRightsContent(lang);

  const [msgs, setMsgs] = useState<ChatMessage[]>([{ from: "bot", text: content.intro }]);
  const [typing, setTyping] = useState(false);
  const [asked, setAsked] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, typing]);

  // Reset chat when language changes
  useEffect(() => {
    setMsgs([{ from: "bot", text: content.intro }]);
    setAsked([]);
  }, [lang]);

  // Suggested questions answer instantly from the built-in knowledge base.
  const ask = (qObj: RightsQA) => {
    if (typing) return;
    setMsgs((m) => [...m, { from: "user", text: qObj.q }]);
    setAsked((a) => [...a, qObj.q]);
    setDraft("");
    setTyping(true);
    trackEvent({ type: "rights_question_asked", language: lang, profession: profile?.profession });
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "bot", text: qObj.a, cites: qObj.cites }]);
    }, 1200);
  };

  // Answer a typed question from the local knowledge base (no API needed).
  const localAnswer = (text: string): { a: string; cites: string[] } => {
    const found = content.questions.find((q) =>
      q.q.split(" ").some((w) => w.length > 3 && text.toLowerCase().includes(w.toLowerCase()))
    );
    if (found) return { a: found.a, cites: found.cites };
    return {
      a: lang === "hi"
        ? "अच्छा सवाल! इसका सटीक जवाब मेरे पास अभी नहीं है — e-Shram हेल्पडेस्क 14434 पर कॉल करें। तब तक नीचे दिए सुझाए सवाल देखें।"
        : "Good question! I don't have an exact answer for that yet — call the e-Shram helpdesk at 14434. Meanwhile, check the suggested questions below.",
      cites: ["e-Shram Helpdesk · 14434"],
    };
  };

  // Typed questions go to the Claude-powered API; if the server has no
  // API key (or errors), it returns { fallback: true } and we answer locally.
  const sendText = async (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;
    setMsgs((m) => [...m, { from: "user", text }]);
    setDraft("");
    setTyping(true);
    trackEvent({ type: "rights_question_asked", language: lang, profession: profile?.profession });

    let reply: { a: string; cites: string[] };
    try {
      const res = await fetch("/api/rights-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, language: lang }),
      });
      const data = await res.json();
      reply = res.ok && data.answer
        ? { a: data.answer, cites: data.cites ?? [] }
        : localAnswer(text);
    } catch {
      reply = localAnswer(text);
    }

    setTyping(false);
    setMsgs((m) => [...m, { from: "bot", text: reply.a, cites: reply.cites.length ? reply.cites : undefined }]);
  };
  const sendDraft = () => sendText(draft);

  // Voice input (Web Speech API) — speak the question in the chosen language.
  const [listening, setListening] = useState(false);
  const [voiceOk, setVoiceOk] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);
  useEffect(() => { setVoiceOk(!!getSpeechRec()); }, []);
  const startVoice = () => {
    const Ctor = getSpeechRec();
    if (!Ctor) return;
    if (listening) { recRef.current?.stop(); return; }
    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = localeTag(lang);
    rec.interimResults = false; rec.continuous = false; rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const tr = e.results?.[0]?.[0]?.transcript;
      setListening(false);
      if (tr) sendText(tr);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  };

  const remaining = content.questions.filter((q) => !asked.includes(q.q));

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: "#E7EEEA" }}>
      {/* Chat header */}
      <div style={{ flexShrink: 0, padding: "18px 18px 14px", background: "linear-gradient(160deg,#0FA080,#067352)", display: "flex", alignItems: "center", gap: 12, zIndex: 5 }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, background: "rgba(255,255,255,.15)", border: "2px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={20} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16.5, color: "#fff" }}>
            RideKamao Saathi
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#9BF0CE", display: "inline-block" }} />
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.85)", fontWeight: 600 }}>
              {lang === "hi" ? "online · आपके हक़ का साथी" : "online · Your rights companion"}
            </span>
          </div>
        </div>
        {profile && (
          <div style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.9)", textTransform: "uppercase", letterSpacing: ".5px" }}>
              {(profile.language || "EN").toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="noscroll" style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px", backgroundImage: "radial-gradient(rgba(12,146,103,.05) 1px, transparent 1px)", backgroundSize: "22px 22px", minHeight: 0 }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: G.muted, background: "rgba(255,255,255,.75)", padding: "4px 12px", borderRadius: 8 }}>
            {lang === "hi" ? "कानूनी जानकारी · निजी और सुरक्षित" : "Legal information · Private & secure"}
          </span>
        </div>
        {/* Govt schemes entry */}
        <Link href="/schemes" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", marginBottom: 14, borderRadius: 16, background: "linear-gradient(150deg,#0B6B48,#064D33)", textDecoration: "none", boxShadow: "0 12px 28px -14px rgba(4,77,51,.55)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Landmark size={20} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14.5, color: "#fff", lineHeight: 1.2 }}>{tr(lang, "schemes.entryTitle")}</div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.8)", marginTop: 2 }}>{tr(lang, "schemes.entrySub")}</div>
          </div>
          <ChevronRight size={20} color="rgba(255,255,255,.85)" style={{ flexShrink: 0 }} />
        </Link>

        {msgs.map((m, i) => <Bubble key={i} m={m} locale={localeTag(lang)} />)}
        {typing && <TypingIndicator />}

        {!typing && remaining.length > 0 && (
          <div style={{ marginTop: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: .6, textTransform: "uppercase", color: G.faint, margin: "4px 2px 8px" }}>
              {lang === "hi" ? "सुझाए सवाल" : "Suggested questions"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, alignItems: "flex-start" }}>
              {remaining.slice(0, 4).map((q, i) => (
                <button key={i} onClick={() => ask(q)} className="dvg" style={{ textAlign: "left", padding: "10px 13px", borderRadius: "14px 14px 14px 5px", background: G.surface, border: `1.5px solid ${G.green100}`, fontSize: 13.5, fontWeight: 600, color: G.green700, boxShadow: "0 1px 4px rgba(10,24,18,.08)", maxWidth: "92%", cursor: "pointer" }}>
                  {q.q}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ height: 4 }} />
      </div>

      {/* Input bar */}
      <div style={{ flexShrink: 0, padding: "10px 12px 14px", background: G.surface, borderTop: `1px solid ${G.line}`, display: "flex", alignItems: "center", gap: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendDraft(); }}
          placeholder={listening ? (lang === "hi" ? "सुन रहे हैं…" : "Listening…") : (lang === "hi" ? "अपना सवाल लिखें…" : "Type your question…")}
          className="dvg"
          style={{ flex: 1, height: 46, borderRadius: 23, border: `1.5px solid ${listening ? G.green : G.line}`, padding: "0 18px", fontSize: 14.5, outline: "none", background: G.bg, color: G.ink, fontFamily: lang === "hi" ? "'Noto Sans Devanagari', sans-serif" : "inherit" }}
        />
        {voiceOk && (
          <button
            onClick={startVoice}
            aria-label="Voice"
            style={{ width: 46, height: 46, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${listening ? G.green : G.line}`, background: listening ? G.green : G.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", animation: listening ? "rk-pulse 1.2s infinite" : "none" }}
          >
            <Mic size={19} color={listening ? "#fff" : G.green700} />
          </button>
        )}
        <button
          onClick={sendDraft}
          style={{ width: 46, height: 46, borderRadius: "50%", flexShrink: 0, border: "none", background: "linear-gradient(160deg,#13A878,#0A8460)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 14px -6px rgba(10,140,95,.6)", cursor: "pointer" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M2 21L23 12 2 3v7l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  );
}
