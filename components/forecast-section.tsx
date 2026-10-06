"use client";

// "Next 5 days" on the Heat tab: the forecast for each day and, when a day is
// opened, what it means for this rider's kind of work. The numbers come from
// Open-Meteo; the impact lines are rules in lib/forecast.ts.

import { useEffect, useState } from "react";
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudLightning, ChevronDown } from "lucide-react";

import { useT, useLang, localeTag, profTitle, type I18nKey } from "@/lib/i18n";
import { useProfile } from "@/lib/ridekamao-profile";
import { PROFESSIONS } from "@/lib/ridekamao-data";
import {
  fetchForecast, impactsFor, dayTone, workGroup, skyKind,
  type Forecast, type DayForecast, type Impact, type Tone, type SkyKind,
} from "@/lib/forecast";

const G = {
  ink: "#05160E", muted: "#456055", faint: "#7A9A8A",
  line: "#BDD8C8", line2: "#DDF0E6", surface: "#FFFFFF", bg: "#EBF7F1",
  green: "#0A9060", green50: "#D8F5E8", green100: "#B4EAD0", green700: "#045234",
};
// Same tones as the live readings above, so a colour means one thing on this tab.
const TONE: Record<Tone, { c: string; bg: string }> = {
  safe: { c: "#1E9C47", bg: "#E2F6E8" },
  mod:  { c: "#B86800", bg: "#FEF0D6" },
  high: { c: "#C25200", bg: "#FFE8D4" },
  ext:  { c: "#C93B35", bg: "#FDE8E7" },
};
const TONE_KEY: Record<Tone, I18nKey> = { safe: "heat.safe", mod: "heat.caution", high: "heat.high", ext: "heat.extreme" };

const SKY: Record<SkyKind, typeof Sun> = {
  clear: Sun, partly: CloudSun, cloud: Cloud, fog: CloudFog, drizzle: CloudDrizzle, rain: CloudRain, storm: CloudLightning,
};

// Kinds whose advice differs by vehicle; the rest share one line for everyone.
const PER_GROUP = new Set<Impact["kind"]>(["storm", "heat", "rain", "aqi", "wind"]);
function bodyKey(i: Impact, group: "bike" | "auto" | "cab"): I18nKey {
  return (PER_GROUP.has(i.kind) ? `fc.${i.kind}.${group}` : `fc.${i.kind}.all`) as I18nKey;
}
const titleKey = (i: Impact): I18nKey => `fc.${i.kind}.t` as I18nKey;

/** "2026-10-06" → local-midnight Date (avoids the UTC shift of `new Date(str)`). */
function parseDay(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}
/** Today's date in India, as YYYY-MM-DD, whatever the device timezone is. */
function todayInIndia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}
function addDays(date: string, n: number): string {
  const d = parseDay(date); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type State = { status: "loading" } | { status: "error" } | { status: "ok"; data: Forecast };

export function ForecastSection({ coords, scope }: { coords: { lat: number; lon: number }; scope: "ncr" | "local" }) {
  const t = useT();
  const lang = useLang();
  const { profile } = useProfile();
  const [guestProf, setGuestProf] = useState("food");
  const [state, setState] = useState<State>({ status: "loading" });
  const [open, setOpen] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const profession = profile?.profession ?? guestProf;
  const group = workGroup(profession);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let data: Forecast | null = null;
      try {
        const r = await fetch(`/api/forecast?lat=${coords.lat}&lon=${coords.lon}`);
        const j = await r.json();
        if (r.ok && j?.ok && Array.isArray(j.days) && j.days.length) data = j as Forecast;
      } catch { /* fall through to the direct call */ }
      // Open-Meteo allows browser calls, so a server hiccup need not blank the section.
      if (!data) data = await fetchForecast(coords.lat, coords.lon);
      if (cancelled) return;
      if (data) {
        setState({ status: "ok", data });
        setOpen((cur) => cur ?? data.days[0]?.date ?? null);
      } else setState({ status: "error" });
    })();
    return () => { cancelled = true; };
  }, [coords.lat, coords.lon, attempt]);

  const retry = () => { setState({ status: "loading" }); setAttempt((n) => n + 1); };

  const today = todayInIndia();
  const tomorrow = addDays(today, 1);
  const dayLabel = (d: DayForecast) =>
    d.date === today ? t("fc.today")
      : d.date === tomorrow ? t("fc.tomorrow")
        : parseDay(d.date).toLocaleDateString(localeTag(lang), { weekday: "short", day: "numeric", month: "short" });

  return (
    <section aria-labelledby="fc-title" style={{ padding: "22px 20px 0" }}>
      <h2 id="fc-title" style={{ margin: 0, fontWeight: 800, fontSize: 19, letterSpacing: "-.3px", color: G.ink }}>{t("fc.title")}</h2>
      <p style={{ margin: "3px 0 12px", fontSize: 12.5, lineHeight: 1.45, color: G.muted }}>{t(scope === "local" ? "fc.subLocal" : "fc.subNcr")}</p>

      {!profile && (
        <select value={guestProf} onChange={(e) => setGuestProf(e.target.value)} aria-label={t("ob.s1.title")} className="rk-focus"
          style={{ width: "100%", height: 48, marginBottom: 10, borderRadius: 12, border: `1.5px solid ${G.line}`, background: G.surface, color: G.ink, fontWeight: 700, fontSize: 14, padding: "0 12px" }}>
          {PROFESSIONS.map((p) => <option key={p.id} value={p.id}>{profTitle(p.id, lang)}</option>)}
        </select>
      )}

      {state.status === "loading" && (
        <div role="status" style={{ padding: 16, background: G.surface, borderRadius: 16, border: `1px solid ${G.line}`, color: G.muted, fontSize: 13 }}>{t("fc.loading")}</div>
      )}

      {state.status === "error" && (
        <div role="alert" style={{ padding: 16, background: G.surface, borderRadius: 16, border: `1px solid ${G.line}` }}>
          <p style={{ margin: "0 0 12px", color: G.muted, fontSize: 13, lineHeight: 1.5 }}>{t("fc.unavailable")}</p>
          <button onClick={retry} className="rk-focus" style={{ minHeight: 48, padding: "0 18px", borderRadius: 12, border: `1px solid ${G.green100}`, background: G.green50, color: G.green700, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{t("fc.retry")}</button>
        </div>
      )}

      {state.status === "ok" && (
        <>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, background: G.surface, borderRadius: 18, border: `1px solid ${G.line}`, overflow: "hidden", boxShadow: "0 2px 4px rgba(5,22,14,.04), 0 12px 26px -14px rgba(5,22,14,.22)" }}>
            {state.data.days.map((d, idx) => {
              const impacts = impactsFor(d, group);
              const tone = dayTone(impacts);
              const tn = TONE[tone];
              const isOpen = open === d.date;
              const Sky = SKY[skyKind(d.code)];
              const panelId = `fc-panel-${d.date}`;
              return (
                <li key={d.date} style={{ borderTop: idx ? `1px solid ${G.line2}` : "none" }}>
                  <button onClick={() => setOpen(isOpen ? null : d.date)} aria-expanded={isOpen} aria-controls={panelId} className="rk-focus"
                    style={{ width: "100%", minHeight: 64, display: "flex", alignItems: "center", gap: 12, padding: "10px 14px 10px 0", background: isOpen ? G.bg : "transparent", border: "none", cursor: "pointer", textAlign: "left", color: G.ink }}>
                    {/* The bar's colour is the day's worst warning; the chip repeats it in words. */}
                    <span aria-hidden style={{ alignSelf: "stretch", width: 5, borderRadius: "0 4px 4px 0", background: tn.c, flexShrink: 0 }} />
                    <Sky size={22} color={G.muted} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>{dayLabel(d)}</span>
                      <span style={{ display: "block", marginTop: 3, fontSize: 12, color: G.muted, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {d.rainProb != null ? `${Math.round(d.rainProb)}% ${t("fc.rainShort")}` : ""}
                        {d.rainProb != null && d.aqi != null ? "  ·  " : ""}
                        {d.aqi != null ? `${t("heat.m.aqi")} ${d.aqi}` : ""}
                      </span>
                    </span>
                    <span style={{ textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                      <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: "-.4px" }}>{d.tMax != null ? `${Math.round(d.tMax)}°` : "--"}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: G.faint }}>{d.tMin != null ? ` ${Math.round(d.tMin)}°` : ""}</span>
                    </span>
                    <span style={{ flexShrink: 0, minWidth: 62, textAlign: "center", padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: tn.bg, color: tn.c }}>{t(TONE_KEY[tone])}</span>
                    <ChevronDown size={18} color={G.faint} aria-hidden style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .18s ease" }} />
                  </button>

                  {isOpen && (
                    <div id={panelId} style={{ padding: "4px 16px 16px 17px", background: G.bg }}>
                      <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: G.muted }}>{t("fc.for", { work: profTitle(profession, lang) })}</p>
                      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
                        {impacts.map((i) => (
                          <li key={i.kind} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <span aria-hidden style={{ width: 9, height: 9, borderRadius: "50%", background: TONE[i.tone].c, marginTop: 5, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 13.5, color: G.ink, lineHeight: 1.3 }}>{t(titleKey(i), i.vars)}</div>
                              <p style={{ margin: "3px 0 0", fontSize: 13, lineHeight: 1.55, color: "#163022" }}>{t(bodyKey(i, group))}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <p style={{ margin: "10px 2px 0", fontSize: 11.5, lineHeight: 1.5, color: G.faint }}>{t("fc.note")}</p>
        </>
      )}
    </section>
  );
}
