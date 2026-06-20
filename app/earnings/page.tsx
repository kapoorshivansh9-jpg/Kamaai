"use client";

import { useState, useEffect } from "react";
import { Wallet, TrendingUp, Pencil, Trash2, X } from "lucide-react";
import { useProfile } from "@/lib/ridekamao-profile";
import { useT, useLang, localeTag } from "@/lib/i18n";

const G = {
  ink: "#05160E", ink2: "#163022", muted: "#456055", faint: "#7A9A8A",
  line: "#BDD8C8", line2: "#DDF0E6", surface: "#FFFFFF", bg: "#EBF7F1",
  green: "#0A9060", green50: "#D8F5E8", green100: "#B4EAD0", green700: "#045234",
  rose: "#C2410C", rose50: "#FFEDE3",
};

type PlatformId = "zomato" | "swiggy" | "uber" | "rapido" | "other";
const PLATFORMS: { id: PlatformId; label: string; dot: string }[] = [
  { id: "zomato", label: "Zomato", dot: "#E23744" },
  { id: "swiggy", label: "Swiggy", dot: "#FC8019" },
  { id: "uber", label: "Uber", dot: "#1F2937" },
  { id: "rapido", label: "Rapido", dot: "#EAB308" },
  { id: "other", label: "Other", dot: "#0A9060" },
];
const platMeta = (id: PlatformId) => PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[4];

interface Entry { id: string; date: string; platform: PlatformId; amount: number; hours: number; expenses: number; tips: number; trips: number }
const KEY = "rk-earnings";

// gross = platform payout + tips; net = gross − expenses
const gross = (e: Entry) => e.amount + e.tips;
const net = (e: Entry) => e.amount + e.tips - e.expenses;

function newId(): string {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

/** Load + migrate legacy entries ({date,amount,hours} with no id/platform/expenses). */
function load(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map((e): Entry => ({
      id: typeof e.id === "string" ? e.id : newId(),
      date: e.date,
      platform: PLATFORMS.some((p) => p.id === e.platform) ? e.platform : "other",
      amount: Number(e.amount) || 0,
      hours: Number(e.hours) || 0,
      expenses: Number(e.expenses) || 0,
      tips: Number(e.tips) || 0,
      trips: Number(e.trips) || 0,
    }));
  } catch { return []; }
}
function persist(list: Entry[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
function weekStartMs(): number {
  const x = new Date();
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function EarningsPage() {
  const t = useT();
  const lang = useLang();
  const { profile } = useProfile();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [amount, setAmount] = useState("");
  const [hours, setHours] = useState("");
  const [expenses, setExpenses] = useState("");
  const [tips, setTips] = useState("");
  const [trips, setTrips] = useState("");
  const [platform, setPlatform] = useState<PlatformId>("other");
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { setEntries(load()); }, []);

  const resetForm = () => { setAmount(""); setHours(""); setExpenses(""); setTips(""); setTrips(""); setPlatform("other"); setEditId(null); };

  const commit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    const hrs = parseFloat(hours);
    const exp = parseFloat(expenses);
    const tp = parseFloat(tips);
    const tr = parseInt(trips, 10);
    const fields = {
      platform, amount: amt,
      hours: isNaN(hrs) ? 0 : hrs,
      expenses: isNaN(exp) ? 0 : exp,
      tips: isNaN(tp) ? 0 : tp,
      trips: isNaN(tr) ? 0 : tr,
    };
    let next: Entry[];
    if (editId) {
      next = entries.map((e) => (e.id === editId ? { ...e, ...fields } : e));
    } else {
      next = [{ id: newId(), date: new Date().toISOString().slice(0, 10), ...fields }, ...entries];
    }
    setEntries(next);
    persist(next);
    resetForm();
  };

  const startEdit = (e: Entry) => {
    setEditId(e.id);
    setAmount(String(e.amount));
    setHours(e.hours ? String(e.hours) : "");
    setExpenses(e.expenses ? String(e.expenses) : "");
    setTips(e.tips ? String(e.tips) : "");
    setTrips(e.trips ? String(e.trips) : "");
    setPlatform(e.platform);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm(t("earn.deleteConfirm"))) return;
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    persist(next);
    if (editId === id) resetForm();
  };

  // ── This week aggregates (net = gross − expenses) ──
  const target = profile?.weeklyTarget ?? 0;
  const weekStart = weekStartMs();
  const weekEntries = entries.filter((e) => new Date(e.date).getTime() >= weekStart);
  const grossWeek = weekEntries.reduce((s, e) => s + gross(e), 0);
  const expWeek = weekEntries.reduce((s, e) => s + e.expenses, 0);
  const netWeek = grossWeek - expWeek;
  const pct = target > 0 ? Math.min(100, Math.round((netWeek / target) * 100)) : 0;

  // ── Per-platform split (this week, by net) ──
  const byPlatform = PLATFORMS.map((p) => {
    const es = weekEntries.filter((e) => e.platform === p.id);
    const n = es.reduce((s, e) => s + net(e), 0);
    const hrs = es.reduce((s, e) => s + e.hours, 0);
    return { ...p, net: n, hrs };
  }).filter((p) => p.net !== 0 || p.hrs > 0).sort((a, b) => b.net - a.net);

  // ── Last 7 days trend (net per calendar day, oldest→newest) ──
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const es = entries.filter((e) => e.date === key);
    const dayNet = es.reduce((s, e) => s + net(e), 0);
    return { key, net: dayNet, label: d.toLocaleDateString(localeTag(lang), { weekday: "short" }).slice(0, 2) };
  });
  const max7 = Math.max(1, ...days7.map((d) => d.net));
  const totalNet7 = days7.reduce((s, d) => s + d.net, 0);
  const last7Entries = entries.filter((e) => days7.some((d) => d.key === e.date));
  const totalHrs7 = last7Entries.reduce((s, e) => s + e.hours, 0);
  const totalTrips7 = last7Entries.reduce((s, e) => s + e.trips, 0);
  const bestDay = days7.reduce((b, d) => (d.net > b.net ? d : b), days7[0]);
  const avgPerHr = totalHrs7 > 0 ? totalNet7 / totalHrs7 : 0;
  const perTrip = totalTrips7 > 0 ? totalNet7 / totalTrips7 : 0;
  const hasTrend = totalNet7 > 0;

  const fmtDate = (d: string) => new Date(d).toLocaleDateString(localeTag(lang), { weekday: "short", day: "numeric", month: "short" });
  const recent = [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <div style={{ background: G.bg, minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ padding: "24px 20px 0" }}>
          <h1 style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 26, letterSpacing: "-.6px", color: G.ink }}>{t("earn.title")}</h1>
          <div style={{ fontSize: 12.5, color: G.muted }}>🔒 {t("earn.sub")}</div>
        </div>

        {/* This week — net take-home */}
        <div style={{ margin: "16px 20px 0" }}>
          <div style={{ borderRadius: 22, padding: "18px 20px", background: "linear-gradient(150deg,#0B6B48,#064D33 60%,#032D1E 100%)", boxShadow: "0 20px 48px -18px rgba(4,77,51,.55)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", color: "rgba(255,255,255,.8)", marginBottom: 8 }}>{t("earn.netThisWeek")}</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 38, color: "#fff", letterSpacing: "-1.2px", lineHeight: .9, fontVariantNumeric: "tabular-nums" }}>{inr(netWeek)}</span>
              {target > 0 && <span style={{ fontSize: 13, color: "rgba(255,255,255,.75)", marginBottom: 4 }}>/ {inr(target)}</span>}
            </div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.72)", marginTop: 7 }}>
              {t("earn.gross")} {inr(grossWeek)}{expWeek > 0 ? ` · ${inr(expWeek)} ${t("earn.costs")}` : ""}
            </div>
            {target > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,.2)", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: "#5DEBB0", transition: "width .6s" }} />
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.8)", fontWeight: 600, marginTop: 6 }}>{pct}% · {t("earn.target")}</div>
              </div>
            )}
          </div>
        </div>

        {/* 7-day trend */}
        {hasTrend && (
          <div style={{ margin: "12px 20px 0", background: G.surface, borderRadius: 18, border: `1px solid ${G.line}`, padding: "16px", boxShadow: "0 2px 8px -4px rgba(10,24,18,.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 14.5, color: G.ink }}>{t("earn.last7")}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: G.green700 }}>{inr(totalNet7)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 84 }}>
              {days7.map((d, i) => {
                const h = Math.max(4, Math.round((d.net / max7) * 70));
                const isBest = d.net > 0 && d.key === bestDay.key;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div title={inr(d.net)} style={{ width: "100%", maxWidth: 26, height: h, borderRadius: 6, background: isBest ? "linear-gradient(180deg,#0FB377,#0A9060)" : d.net > 0 ? G.green100 : G.line2, transition: "height .5s" }} />
                    <div style={{ fontSize: 10, fontWeight: 600, color: i === 6 ? G.green700 : G.faint }}>{d.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <div style={{ flex: 1, background: G.bg, borderRadius: 12, padding: "9px 11px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: G.faint, textTransform: "uppercase", letterSpacing: ".4px" }}>{t("earn.avgPerHr")}</div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: G.ink, marginTop: 2 }}>{avgPerHr > 0 ? inr(avgPerHr) : "—"}</div>
              </div>
              <div style={{ flex: 1, background: G.bg, borderRadius: 12, padding: "9px 11px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: G.faint, textTransform: "uppercase", letterSpacing: ".4px" }}>₹{t("earn.perTrip")}</div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: G.ink, marginTop: 2 }}>{perTrip > 0 ? inr(perTrip) : "—"}</div>
              </div>
              <div style={{ flex: 1, background: G.bg, borderRadius: 12, padding: "9px 11px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: G.faint, textTransform: "uppercase", letterSpacing: ".4px" }}>{t("earn.bestDay")}</div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: G.ink, marginTop: 2 }}>{bestDay.net > 0 ? inr(bestDay.net) : "—"}</div>
              </div>
            </div>
          </div>
        )}

        {/* Per-platform split */}
        {byPlatform.length > 0 && (
          <div style={{ margin: "12px 20px 0", background: G.surface, borderRadius: 18, border: `1px solid ${G.line}`, padding: "16px", boxShadow: "0 2px 8px -4px rgba(10,24,18,.1)" }}>
            <div style={{ fontWeight: 800, fontSize: 14.5, color: G.ink, marginBottom: 12 }}>{t("earn.byPlatform")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {byPlatform.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: p.dot, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: G.ink2 }}>{p.id === "other" ? t("earn.other") : p.label}</span>
                  {p.hrs > 0 && <span style={{ fontSize: 12, color: G.faint }}>{inr(p.net / p.hrs)}{t("earn.perHr")}</span>}
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: G.green700, minWidth: 56, textAlign: "right" }}>{inr(p.net)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Log / edit form */}
        <div style={{ margin: "16px 20px 0", background: G.surface, borderRadius: 18, border: `1.5px solid ${editId ? G.green : G.line}`, padding: "16px", boxShadow: "0 2px 8px -4px rgba(10,24,18,.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 14.5, color: G.ink, display: "flex", alignItems: "center", gap: 8 }}>
              <Wallet size={17} color={G.green700} /> {editId ? t("earn.update") : t("earn.today")}
            </div>
            {editId && (
              <button onClick={resetForm} aria-label={t("earn.cancel")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: G.muted, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 4 }}>
                <X size={14} /> {t("earn.cancel")}
              </button>
            )}
          </div>

          {/* Platform chips */}
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.muted, marginBottom: 6 }}>{t("earn.platform")}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
            {PLATFORMS.map((p) => {
              const on = platform === p.id;
              return (
                <button key={p.id} onClick={() => setPlatform(p.id)} style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, background: on ? G.green50 : G.bg, border: `1.5px solid ${on ? G.green : G.line}`, color: on ? G.green700 : G.muted }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: p.dot }} />
                  {p.id === "other" ? t("earn.other") : p.label}
                </button>
              );
            })}
          </div>

          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.muted, marginBottom: 5 }}>{t("earn.amount")}</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" inputMode="numeric" placeholder="₹"
            style={{ width: "100%", height: 46, borderRadius: 12, border: `1.5px solid ${G.line}`, padding: "0 14px", fontSize: 16, outline: "none", background: G.bg, color: G.ink, marginBottom: 12 }} />

          <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.muted, marginBottom: 5 }}>{t("earn.hours")}</label>
              <input value={hours} onChange={(e) => setHours(e.target.value)} type="number" inputMode="decimal" placeholder="0"
                style={{ width: "100%", height: 46, borderRadius: 12, border: `1.5px solid ${G.line}`, padding: "0 14px", fontSize: 16, outline: "none", background: G.bg, color: G.ink }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.muted, marginBottom: 5 }}>{t("earn.expenses")}</label>
              <input value={expenses} onChange={(e) => setExpenses(e.target.value)} type="number" inputMode="numeric" placeholder="₹"
                style={{ width: "100%", height: 46, borderRadius: 12, border: `1.5px solid ${G.line}`, padding: "0 14px", fontSize: 16, outline: "none", background: G.bg, color: G.ink }} />
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: G.faint, marginBottom: 12 }}>{t("earn.expensesHint")}</div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.muted, marginBottom: 5 }}>{t("earn.tips")}</label>
              <input value={tips} onChange={(e) => setTips(e.target.value)} type="number" inputMode="numeric" placeholder="₹"
                style={{ width: "100%", height: 46, borderRadius: 12, border: `1.5px solid ${G.line}`, padding: "0 14px", fontSize: 16, outline: "none", background: G.bg, color: G.ink }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G.muted, marginBottom: 5 }}>{t("earn.trips")}</label>
              <input value={trips} onChange={(e) => setTrips(e.target.value)} type="number" inputMode="numeric" placeholder="0"
                style={{ width: "100%", height: 46, borderRadius: 12, border: `1.5px solid ${G.line}`, padding: "0 14px", fontSize: 16, outline: "none", background: G.bg, color: G.ink }} />
            </div>
          </div>

          <button onClick={commit} disabled={!amount} style={{ width: "100%", height: 48, borderRadius: 12, border: "none", background: amount ? "linear-gradient(180deg,#0B6B48,#064D33)" : "#B8D8CC", color: "#fff", fontWeight: 700, fontSize: 15, cursor: amount ? "pointer" : "not-allowed" }}>
            {editId ? t("earn.update") : t("earn.add")}
          </button>
        </div>

        {/* Recent entries */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".7px", textTransform: "uppercase", color: G.faint, marginBottom: 11 }}>{t("earn.recent")}</div>
          {recent.length === 0 ? (
            <div style={{ fontSize: 13, color: G.muted, padding: "14px 16px", background: G.surface, borderRadius: 14, border: `1px solid ${G.line}` }}>{t("earn.noEntries")}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recent.slice(0, 30).map((e) => {
                const n = net(e);
                const m = platMeta(e.platform);
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: G.surface, borderRadius: 14, border: `1px solid ${editId === e.id ? G.green : G.line}` }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: G.green50, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                      <TrendingUp size={16} color={G.green700} />
                      <span style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: 4, background: m.dot, border: "2px solid #fff" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: G.ink }}>
                        {inr(n)}
                        {e.tips > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: G.green700, marginLeft: 6 }}>+{inr(e.tips)} {t("earn.tips").replace(" (₹)", "").toLowerCase()}</span>}
                        {e.expenses > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: G.rose, marginLeft: 6 }}>−{inr(e.expenses)}</span>}
                      </div>
                      <div style={{ fontSize: 11.5, color: G.muted }}>
                        {fmtDate(e.date)} · {e.platform === "other" ? t("earn.other") : m.label}{e.hours ? ` · ${e.hours}h` : ""}{e.trips ? ` · ${e.trips} ${t("earn.trips").toLowerCase()}` : ""}
                      </div>
                    </div>
                    {e.hours > 0 && (
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: G.green700, flexShrink: 0 }}>{inr(n / e.hours)}{t("earn.perHr")}</span>
                    )}
                    <button onClick={() => startEdit(e)} aria-label={t("earn.edit")} style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${G.line}`, background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                      <Pencil size={14} color={G.muted} />
                    </button>
                    <button onClick={() => remove(e.id)} aria-label={t("earn.delete")} style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${G.rose50}`, background: G.rose50, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                      <Trash2 size={14} color={G.rose} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
