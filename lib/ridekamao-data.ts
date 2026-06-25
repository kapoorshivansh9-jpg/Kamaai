// RideKamao data layer — types, constants, zone-based shifts, multi-language rights

export interface Language { id: string; label: string; native: string; }
export interface Profession { id: string; title: string; sub: string; base: number; }
export interface Goal { id: string; title: string; sub: string; }

// Window ids are profession-specific now (e.g. "lunch", "airport-early"),
// so this is an open string rather than a fixed union.
export type WindowId = string;

/** A concrete spot to position at, and why it's worth being there. */
export interface Hotspot {
  name: string;
  why: string;
  heat: "peak" | "high" | "good"; // demand intensity at this spot
}

/** Rich, click-to-expand guidance for a shift window. */
export interface WindowDetail {
  position: string;     // one-line "head here" instruction
  hotspots: Hotspot[];  // 2-3 concrete places to be
  drivers: string[];    // what's driving demand right now (events)
  traffic: string;      // current traffic situation
  tip: string;          // one practical tip
}

export interface ShiftWindow {
  id: WindowId;
  time: string; label: string;
  mult: number; demand: number;
  tag: "surge" | "cool" | "steady" | "avoid";
  tagText: string; reason: string; rphr: number;
  zoneNote?: string;
  /** Window bounds as decimal hours (e.g. 9.5 = 9:30). endH may exceed 24 for past-midnight windows. */
  startH: number; endH: number;
  detail: WindowDetail;
}

/** True when `date` falls inside the window (handles past-midnight windows). */
export function isWindowActive(w: ShiftWindow, date: Date = new Date()): boolean {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= w.startH && h < w.endH) return true;
  // Past-midnight windows (e.g. 22.5 → 25 means 10:30 PM – 1:00 AM)
  return w.endH > 24 && h + 24 >= w.startH && h + 24 < w.endH;
}

export interface HeatMetric {
  id: string; label: string; value: string; cat: string;
  tone: "safe" | "mod" | "high" | "ext";
}

export interface SattuPoint { name: string; dist: string; time: string; stock: string; lat?: number; lon?: number; category?: string; }

export interface HeatData {
  level: string; levelLabel: string; feelsLike: number; air: number;
  metrics: HeatMetric[];
  hours: { h: string; r: 0 | 1 | 2 | 3 }[];
  fatigueHour: string; sattu: SattuPoint[];
}

export interface RightsQA { q: string; a: string; cites: string[]; }
export interface RightsContent { intro: string; questions: RightsQA[]; }

export interface RideKamaoProfile {
  language: string; profession: string; goals: string[];
  name: string; email: string; weeklyTarget: number;
}

export interface Zone {
  id: string; label: string;
  lat: [number, number]; lon: [number, number];
}

// ── Static data ────────────────────────────────────────────────

export const LANGUAGES: Language[] = [
  { id: "en", label: "English",  native: "English"   },
  { id: "hi", label: "Hindi",    native: "हिन्दी"     },
  { id: "pa", label: "Punjabi",  native: "ਪੰਜਾਬੀ"    },
  { id: "bn", label: "Bengali",  native: "বাংলা"      },
  { id: "ta", label: "Tamil",    native: "தமிழ்"      },
  { id: "mr", label: "Marathi",  native: "मराठी"      },
];

export const PROFESSIONS: Profession[] = [
  { id: "food",   title: "Food delivery rider",    sub: "Zomato · Swiggy",               base: 1180 },
  { id: "auto",   title: "Auto-rickshaw driver",   sub: "Street & app hailing",           base: 1320 },
  { id: "biketx", title: "Bike taxi rider",         sub: "Rapido · Uber Moto",             base: 1090 },
  { id: "cab",    title: "Cab driver",              sub: "Ola · Uber",                     base: 1620 },
  { id: "qcom",   title: "Quick-commerce rider",    sub: "Blinkit · Zepto · Instamart",    base: 1240 },
];

export const GOALS: Goal[] = [
  { id: "earn",    title: "Maximize daily earnings",    sub: "Squeeze the best earnings from every hour" },
  { id: "target",  title: "Hit a weekly income target", sub: "Plan backwards from a number" },
  { id: "heat",    title: "Avoid heat and stay safe",   sub: "Dodge dangerous afternoon hours" },
  { id: "traffic", title: "Avoid traffic and long trips", sub: "Fewer dead kilometres" },
];

// ── Delhi NCR zones ────────────────────────────────────────────

export const ZONES: Zone[] = [
  { id: "cp",      label: "Connaught Place / Central Delhi", lat: [28.62, 28.67], lon: [77.19, 77.24] },
  { id: "noida",   label: "Noida",                           lat: [28.52, 28.62], lon: [77.32, 77.42] },
  { id: "gurgaon", label: "Gurgaon",                         lat: [28.41, 28.52], lon: [76.99, 77.11] },
  { id: "rohini",  label: "Rohini / Pitampura",              lat: [28.68, 28.75], lon: [77.08, 77.16] },
  { id: "dwarka",  label: "Dwarka / Uttam Nagar",            lat: [28.54, 28.62], lon: [76.99, 77.07] },
  { id: "saket",   label: "Saket / South Delhi",             lat: [28.51, 28.57], lon: [77.19, 77.25] },
  { id: "lajpat",  label: "Lajpat Nagar / Nizamuddin",       lat: [28.56, 28.60], lon: [77.24, 77.28] },
];

export function detectZone(lat: number, lon: number): Zone | null {
  return ZONES.find(
    (z) => lat >= z.lat[0] && lat <= z.lat[1] && lon >= z.lon[0] && lon <= z.lon[1]
  ) ?? null;
}

// ── Shift windows — profession-specific playbooks ─────────────
// Demand multipliers and ₹/hr are MODELLED ESTIMATES of typical Delhi-NCR
// patterns (no gig platform exposes a public live-demand feed). Real nearby
// places come from OpenStreetMap (/api/hotspots) and weather/AQI is live
// (Heat tab). Each gig type has its OWN rhythm and OWN places — see PLAYBOOK.

type Bi = [string, string]; // [English, Hindi]
const bi = (t: Bi, hi: boolean) => (hi ? t[1] : t[0]);

// Date-aware local events — only those whose range includes today ever show, so
// nothing goes stale (this is why the old hard-coded IPL text is gone). Add real
// ones here, e.g.:
//   { from: "2026-10-18", to: "2026-11-01", driver: ["Diwali week — gifting & food orders surge", "दिवाली सप्ताह — गिफ्टिंग व फूड ऑर्डर सर्ज"] }
interface DatedEvent { from: string; to: string; driver: Bi; }
const EVENTS: DatedEvent[] = [];
export function currentEvents(now: Date, lang: string): string[] {
  const today = now.toISOString().slice(0, 10);
  return EVENTS.filter((e) => today >= e.from && today <= e.to).map((e) => bi(e.driver, lang === "hi"));
}

// ── Zone landmarks — concrete places to position at, per zone ──
interface Landmarks { metro: string; market: string; office: string; food: string; nightlife: string; }

const ZONE_LANDMARKS: Record<string, Landmarks> = {
  cp:      { metro: "Rajiv Chowk Metro Gate 5",   market: "CP Inner Circle",          office: "Barakhamba Road offices", food: "CP Block B & C restaurants",     nightlife: "CP bars & Janpath" },
  noida:   { metro: "Sector 18 Metro Gate 2",     market: "Atta Market, Sector 18",   office: "Sector 62 IT parks",      food: "Wave Mall & Sector 18 food court", nightlife: "Sector 18 lounges" },
  gurgaon: { metro: "HUDA City Centre Metro",     market: "Sector 29 Market",         office: "DLF Cyber City",          food: "Cyber Hub restaurants",          nightlife: "Cyber Hub & Sector 29 bars" },
  rohini:  { metro: "Rohini West Metro",          market: "Rohini Sector 3 Market",   office: "Netaji Subhash Place",    food: "Sector 9 eateries",              nightlife: "NSP food street" },
  dwarka:  { metro: "Dwarka Sector 21 Metro",     market: "Sector 6 Market",          office: "Dwarka Expressway offices", food: "Vegas Mall food court",        nightlife: "Vegas Mall" },
  saket:   { metro: "Saket Metro Gate 1",         market: "Select Citywalk",          office: "Saket District Centre",   food: "Saket mall restaurants",         nightlife: "Garden of Five Senses area" },
  lajpat:  { metro: "Lajpat Nagar Metro Gate 3",  market: "Central Market, Lajpat Nagar", office: "Nehru Place IT hub",  food: "Nehru Place eateries",           nightlife: "Defence Colony market" },
};

const NCR_DEFAULT: Landmarks = {
  metro: "Rajiv Chowk / Kashmere Gate Metro",
  market: "Connaught Place",
  office: "Barakhamba & Nehru Place offices",
  food: "Connaught Place restaurants",
  nightlife: "Hauz Khas Village & CP",
};

// Extra per-zone places used by the playbooks (kept separate so the core
// landmark table above stays compact). {mall}/{residential} fall back sensibly.
const ZONE_EXTRA: Record<string, { mall: string; residential: string }> = {
  cp:      { mall: "Palika Bazaar",         residential: "Gole Market & Mandir Marg homes" },
  noida:   { mall: "DLF Mall of India",     residential: "Sector 50–78 societies" },
  gurgaon: { mall: "Ambience Mall",         residential: "DLF Phase 1–5 condos" },
  rohini:  { mall: "Unity One Mall",        residential: "Rohini Sector 7–13 flats" },
  dwarka:  { mall: "Vegas Mall",            residential: "Dwarka Sector 10–23 societies" },
  saket:   { mall: "Select Citywalk",       residential: "Saket & Malviya Nagar homes" },
  lajpat:  { mall: "Epicuria, Nehru Place", residential: "Lajpat Nagar & Nizamuddin homes" },
};
const AIRPORT = "IGI Airport T1 / T2 / T3";

// Replace {tokens} in playbook text with this zone's real landmark names.
function fillTokens(s: string, L: Landmarks, zoneId: string | null): string {
  const x = (zoneId && ZONE_EXTRA[zoneId]) || { mall: L.market, residential: "nearby residential colonies" };
  return s
    .replace(/\{metro\}/g, L.metro)
    .replace(/\{market\}/g, L.market)
    .replace(/\{office\}/g, L.office)
    .replace(/\{food\}/g, L.food)
    .replace(/\{nightlife\}/g, L.nightlife)
    .replace(/\{mall\}/g, x.mall)
    .replace(/\{residential\}/g, x.residential)
    .replace(/\{airport\}/g, AIRPORT);
}

// ── Per-profession playbooks ──────────────────────────────────
// Each gig type gets its OWN windows and OWN places. {tokens} are swapped for
// real zone landmarks at runtime. At most one "avoid" window per profession.
interface HotspotT { place: Bi; why: Bi; heat: "peak" | "high" | "good"; }
interface WinSpec {
  id: string; time: string; startH: number; endH: number;
  mult: number; demand: number; rphr: number;
  tag: ShiftWindow["tag"]; tagText: Bi; label: Bi; reason: Bi;
  position: Bi; hotspots: HotspotT[]; tip: Bi; drivers?: Bi[]; traffic?: Bi;
}

const PLAYBOOK: Record<string, WinSpec[]> = {
  // ── Food delivery — Zomato / Swiggy: meal-time peaks at restaurants & homes ──
  food: [
    { id: "breakfast", time: "7:00 – 10:00 AM", startH: 7, endH: 10, mult: 1.4, demand: 0.6, rphr: 150,
      tag: "steady", tagText: ["Steady", "स्थिर"], label: ["Breakfast orders", "नाश्ता ऑर्डर"],
      reason: ["Breakfast, chai & coffee orders from homes and offices before the heat builds.", "गर्मी बढ़ने से पहले घरों व ऑफिस से नाश्ता, चाय व कॉफ़ी ऑर्डर।"],
      position: ["Wait between {food} and {residential} for short breakfast hops.", "छोटी नाश्ता ट्रिप के लिए {food} व {residential} के बीच रहें।"],
      hotspots: [
        { place: ["{food}", "{food}"], why: ["Cafés & breakfast joints open", "कैफ़े व नाश्ता जॉइंट खुलते"], heat: "high" },
        { place: ["{residential}", "{residential}"], why: ["Home breakfast & first grocery orders", "घर के नाश्ता व पहले ग्रोसरी ऑर्डर"], heat: "good" },
      ],
      drivers: [["Morning breakfast & chai demand", "सुबह नाश्ता व चाय डिमांड"], ["Offices & schools opening", "ऑफिस व स्कूल खुल रहे"]],
      traffic: ["Light early, building by 9 — easy short trips.", "जल्दी हल्का, 9 तक बढ़ता — आसान छोटी ट्रिप।"],
      tip: ["Stay near restaurant clusters so pickups are fast and can be batched.", "रेस्तराँ इलाके के पास रहें ताकि पिकअप तेज़ व बैच हों।"] },
    { id: "mid-morning", time: "10:00 AM – 12:00 PM", startH: 10, endH: 12, mult: 1.2, demand: 0.5, rphr: 130,
      tag: "steady", tagText: ["Steady", "स्थिर"], label: ["Mid-morning", "देर सुबह"],
      reason: ["Brunch, coffee & snack orders tick along before lunch — low competition, easy short trips.", "लंच से पहले ब्रंच, कॉफ़ी व स्नैक ऑर्डर चलते — कम मुकाबला, आसान छोटी ट्रिप।"],
      position: ["Stay near {food} and {mall} for brunch & coffee runs.", "ब्रंच व कॉफ़ी ट्रिप के लिए {food} व {mall} के पास रहें।"],
      hotspots: [
        { place: ["{food}", "{food}"], why: ["Brunch & coffee orders", "ब्रंच व कॉफ़ी ऑर्डर"], heat: "high" },
        { place: ["{mall}", "{mall}"], why: ["Café & bakery pickups", "कैफ़े व बेकरी पिकअप"], heat: "good" },
      ],
      tip: ["A calm window to get easy short orders before the lunch rush.", "लंच रश से पहले आसान छोटे ऑर्डर बटोरने की शांत विंडो।"] },
    { id: "lunch", time: "12:00 – 3:00 PM", startH: 12, endH: 15, mult: 2.0, demand: 0.95, rphr: 230,
      tag: "surge", tagText: ["2.0× lunch peak", "2.0× लंच पीक"], label: ["Lunch peak", "लंच पीक"],
      reason: ["Your biggest daytime money window — office & home lunch orders surge. Drink water: midday heat is high.", "दिन की सबसे बड़ी कमाई विंडो — ऑफिस व घर के लंच ऑर्डर सर्ज। पानी पिएँ: दोपहर गर्मी तेज़।"],
      position: ["Wait at {office} and {food}; pick batched orders going the same way.", "{office} व {food} पर रहें; एक ही दिशा के बैच ऑर्डर लें।"],
      hotspots: [
        { place: ["{office}", "{office}"], why: ["Office lunch orders at peak", "ऑफिस लंच ऑर्डर पीक पर"], heat: "peak" },
        { place: ["{food}", "{food}"], why: ["Restaurants firing lunch fastest", "रेस्तराँ सबसे तेज़ लंच बना रहे"], heat: "peak" },
        { place: ["{residential}", "{residential}"], why: ["Work-from-home lunch deliveries", "घर से काम वालों के लंच ऑर्डर"], heat: "high" },
      ],
      drivers: [["Office + home lunch rush", "ऑफिस + घर लंच रश"], ["Restaurants at peak output", "रेस्तराँ पीक आउटपुट"]],
      traffic: ["Moderate — keep to short restaurant-to-home hops.", "मध्यम — छोटी रेस्तराँ-से-घर हॉप रखें।"],
      tip: ["Carry water and ORS — the orders are worth it but the heat is real.", "पानी व ORS रखें — ऑर्डर फ़ायदेमंद पर गर्मी असली है।"] },
    { id: "afternoon", time: "3:00 – 6:00 PM", startH: 15, endH: 18, mult: 1.1, demand: 0.45, rphr: 115,
      tag: "steady", tagText: ["Quiet", "शांत"], label: ["Afternoon lull", "दोपहर मंदी"],
      reason: ["Orders dip between meals — rest in shade, recharge, and pre-position for the dinner surge.", "भोजन के बीच ऑर्डर कम — छाँव में आराम, रिचार्ज व डिनर सर्ज की तैयारी।"],
      position: ["Rest near {mall}; take snack, tea & dessert orders as they come.", "{mall} के पास आराम; स्नैक, चाय व डेज़र्ट ऑर्डर लें।"],
      hotspots: [
        { place: ["{food}", "{food}"], why: ["Snack, tea & dessert orders", "स्नैक, चाय व डेज़र्ट ऑर्डर"], heat: "good" },
        { place: ["{mall}", "{mall}"], why: ["Mall food-court pickups", "मॉल फूड कोर्ट पिकअप"], heat: "good" },
      ],
      drivers: [["Between-meal snack orders", "भोजन के बीच स्नैक ऑर्डर"], ["Fewer riders online", "कम राइडर ऑनलाइन"]],
      traffic: ["Clear roads — low fuel burn.", "साफ़ सड़कें — कम तेल खर्च।"],
      tip: ["Recharge your phone and body so you're strong for dinner.", "फ़ोन व शरीर रिचार्ज करें ताकि डिनर के लिए मज़बूत रहें।"] },
    { id: "dinner", time: "7:00 – 11:00 PM", startH: 19, endH: 23, mult: 2.2, demand: 0.98, rphr: 250,
      tag: "surge", tagText: ["2.2× dinner peak", "2.2× डिनर पीक"], label: ["Dinner peak", "डिनर पीक"],
      reason: ["The top earning window — dinner & dessert orders spike across homes and restaurants in cooler air.", "सबसे ज़्यादा कमाई विंडो — ठंडी हवा में घरों व रेस्तराँ में डिनर व डेज़र्ट ऑर्डर बढ़ते।"],
      position: ["Work {food} → {residential} routes and batch nearby drops.", "{food} → {residential} रूट पर काम करें व पास के ड्रॉप बैच करें।"],
      hotspots: [
        { place: ["{food}", "{food}"], why: ["Peak dinner & dessert orders", "पीक डिनर व डेज़र्ट ऑर्डर"], heat: "peak" },
        { place: ["{residential}", "{residential}"], why: ["Family dinner deliveries", "परिवार डिनर डिलीवरी"], heat: "peak" },
        { place: ["{nightlife}", "{nightlife}"], why: ["Late diners & desserts", "देर डाइनर व डेज़र्ट"], heat: "high" },
      ],
      drivers: [["Dinner rush at full peak", "डिनर रश पूरे पीक पर"], ["Cooler evening brings more orders", "ठंडी शाम ज़्यादा ऑर्डर लाती है"]],
      traffic: ["Busy near restaurants — short hops beat long cross-city trips.", "रेस्तराँ के पास भीड़ — छोटी हॉप लंबी ट्रिप से बेहतर।"],
      tip: ["Highest pay of the day — stack batched orders in one cluster.", "दिन की सबसे ज़्यादा कमाई — एक इलाके में बैच ऑर्डर लें।"] },
    { id: "late", time: "11:00 PM – 1:00 AM", startH: 23, endH: 25, mult: 1.6, demand: 0.5, rphr: 185,
      tag: "steady", tagText: ["Late premium", "देर प्रीमियम"], label: ["Late-night cravings", "देर रात क्रेविंग"],
      reason: ["Fewer riders online — late supper & dessert orders pay a premium.", "कम राइडर ऑनलाइन — देर सपर व डेज़र्ट ऑर्डर प्रीमियम देते।"],
      position: ["Cover 24×7 food clusters near {nightlife}.", "{nightlife} के पास 24×7 फूड इलाके कवर करें।"],
      hotspots: [
        { place: ["{nightlife}", "{nightlife}"], why: ["Supper & dessert cravings", "सपर व डेज़र्ट क्रेविंग"], heat: "high" },
        { place: ["24×7 food spots", "24×7 फूड स्पॉट"], why: ["Steady late orders", "स्थिर देर ऑर्डर"], heat: "good" },
      ],
      drivers: [["Fewer riders — premium pay", "कम राइडर — प्रीमियम कमाई"], ["Late supper orders", "देर सपर ऑर्डर"]],
      traffic: ["Near-empty roads — fastest trips. Stick to lit routes.", "लगभग खाली सड़कें — सबसे तेज़ ट्रिप। रोशनी वाले रूट पर रहें।"],
      tip: ["Only ride if rested — safety first.", "तभी चलाएँ जब आराम किया हो — सुरक्षा पहले।"] },
  ],

  // ── Quick-commerce — Blinkit / Zepto / Instamart: dark-store + home runs ──
  qcom: [
    { id: "morning-grocery", time: "7:30 – 11:00 AM", startH: 7.5, endH: 11, mult: 1.8, demand: 0.85, rphr: 175,
      tag: "surge", tagText: ["1.8× morning", "1.8× सुबह"], label: ["Morning grocery rush", "सुबह ग्रोसरी रश"],
      reason: ["Households restock for the day — milk, bread, eggs & essentials surge from your dark store.", "घर दिन भर का सामान भरते — डार्क स्टोर से दूध, ब्रेड, अंडे व ज़रूरी सामान सर्ज।"],
      position: ["Stay at your dark store near {residential} — quick 2 km hops.", "{residential} के पास अपने डार्क स्टोर पर रहें — झटपट 2 किमी हॉप।"],
      hotspots: [
        { place: ["Blinkit / Zepto dark store", "Blinkit / Zepto डार्क स्टोर"], why: ["Morning restock orders peak", "सुबह रीस्टॉक ऑर्डर पीक पर"], heat: "high" },
        { place: ["{residential}", "{residential}"], why: ["Household essentials & milk", "घर का ज़रूरी सामान व दूध"], heat: "high" },
      ],
      drivers: [["Daily household restock", "रोज़ का घर रीस्टॉक"], ["Breakfast & milk runs", "नाश्ता व दूध ट्रिप"]],
      traffic: ["Light residential roads — fast 10-min deliveries.", "हल्की रिहायशी सड़कें — तेज़ 10-मिनट डिलीवरी।"],
      tip: ["Stay glued to the dark store — the closer you are, the more orders you grab.", "डार्क स्टोर के पास रहें — जितने पास, उतने ज़्यादा ऑर्डर।"] },
    { id: "midday", time: "12:00 – 4:00 PM", startH: 12, endH: 16, mult: 1.0, demand: 0.45, rphr: 105,
      tag: "steady", tagText: ["Heat 46°C · light", "गर्मी 46°C · हल्का"], label: ["Midday essentials", "दोपहर ज़रूरी सामान"],
      reason: ["Lighter orders and high heat — take only short trips and hydrate between them.", "कम ऑर्डर व तेज़ गर्मी — सिर्फ़ छोटी ट्रिप लें और बीच में पानी पिएँ।"],
      position: ["Wait in shade at the dark store; accept short essential orders only.", "डार्क स्टोर पर छाँव में रहें; सिर्फ़ छोटे ज़रूरी ऑर्डर लें।"],
      hotspots: [
        { place: ["Dark-store shade", "डार्क स्टोर छाँव"], why: ["Cool off between short runs", "छोटी ट्रिप के बीच ठंडे हों"], heat: "good" },
        { place: ["{residential}", "{residential}"], why: ["Cold drinks & quick essentials", "कोल्ड ड्रिंक व झटपट ज़रूरी सामान"], heat: "good" },
      ],
      drivers: [["Cold drinks & ice-cream orders", "कोल्ड ड्रिंक व आइसक्रीम ऑर्डर"], ["Demand dips in the heat", "गर्मी में डिमांड गिरती"]],
      traffic: ["Open roads but dangerous heat — keep trips short.", "सड़कें खाली पर गर्मी ख़तरनाक — ट्रिप छोटी रखें।"],
      tip: ["Use the Heat tab to find the nearest free water point.", "नज़दीकी मुफ़्त पानी पॉइंट के लिए गर्मी टैब देखें।"] },
    { id: "pre-evening", time: "4:00 – 6:00 PM", startH: 16, endH: 18, mult: 1.3, demand: 0.6, rphr: 135,
      tag: "steady", tagText: ["Warming up", "बढ़ रहा"], label: ["Pre-evening pickup", "शाम से पहले"],
      reason: ["Orders climb as the day cools and people plan dinner — get set before the evening surge.", "दिन ठंडा होते व लोग डिनर सोचते ही ऑर्डर बढ़ते — शाम सर्ज से पहले तैयार हों।"],
      position: ["Return to your dark store covering {residential}.", "{residential} कवर करने वाले अपने डार्क स्टोर पर लौटें।"],
      hotspots: [
        { place: ["{residential}", "{residential}"], why: ["Snacks & tea-time orders", "स्नैक व चाय-टाइम ऑर्डर"], heat: "high" },
        { place: ["Blinkit / Zepto dark store", "Blinkit / Zepto डार्क स्टोर"], why: ["Restocking before dinner", "डिनर से पहले रीस्टॉक"], heat: "good" },
      ],
      tip: ["Be back at the store by 5:30 so you don't miss the evening surge.", "5:30 तक स्टोर पर लौटें ताकि शाम सर्ज न छूटे।"] },
    { id: "evening", time: "6:00 – 9:30 PM", startH: 18, endH: 21.5, mult: 1.9, demand: 0.92, rphr: 185,
      tag: "surge", tagText: ["1.9× evening", "1.9× शाम"], label: ["Evening grocery surge", "शाम ग्रोसरी सर्ज"],
      reason: ["Families order dinner groceries, snacks & vegetables after work — the day's busiest stretch.", "परिवार काम के बाद डिनर ग्रोसरी, स्नैक व सब्ज़ी मंगाते — दिन का सबसे व्यस्त समय।"],
      position: ["Wait at the dark store covering {residential} — orders stack fast.", "{residential} कवर करने वाले डार्क स्टोर पर रहें — ऑर्डर तेज़ी से बढ़ते।"],
      hotspots: [
        { place: ["{residential}", "{residential}"], why: ["Dinner groceries & vegetables", "डिनर ग्रोसरी व सब्ज़ी"], heat: "peak" },
        { place: ["Blinkit / Zepto dark store", "Blinkit / Zepto डार्क स्टोर"], why: ["Snack & essentials surge", "स्नैक व ज़रूरी सामान सर्ज"], heat: "high" },
      ],
      drivers: [["After-work dinner restock", "काम के बाद डिनर रीस्टॉक"], ["Snack & cold-drink orders", "स्नैक व कोल्ड ड्रिंक ऑर्डर"]],
      traffic: ["Building in colonies — but trips stay short.", "कॉलोनियों में बढ़ रहा — पर ट्रिप छोटी रहती।"],
      tip: ["Evening is your dinner-equivalent peak — don't take a break now.", "शाम आपका पीक है — अभी ब्रेक न लें।"] },
    { id: "late", time: "10:00 PM – 1:00 AM", startH: 22, endH: 25, mult: 1.7, demand: 0.55, rphr: 170,
      tag: "steady", tagText: ["Late premium", "देर प्रीमियम"], label: ["Late-night essentials", "देर रात ज़रूरी सामान"],
      reason: ["Fewer riders online — late-night snacks, medicines & essentials pay a premium.", "कम राइडर ऑनलाइन — देर रात स्नैक, दवा व ज़रूरी सामान प्रीमियम देते।"],
      position: ["Cover 24×7 stores near {residential} and {nightlife}.", "{residential} व {nightlife} के पास 24×7 स्टोर कवर करें।"],
      hotspots: [
        { place: ["{residential}", "{residential}"], why: ["Late snacks & medicine runs", "देर रात स्नैक व दवा ट्रिप"], heat: "high" },
        { place: ["24×7 stores", "24×7 स्टोर"], why: ["Essentials all night", "रातभर ज़रूरी सामान"], heat: "good" },
      ],
      drivers: [["Fewer riders — premium pay", "कम राइडर — प्रीमियम कमाई"], ["Late snack & medicine orders", "देर स्नैक व दवा ऑर्डर"]],
      traffic: ["Empty roads — fastest trips. Stick to lit routes.", "खाली सड़कें — सबसे तेज़ ट्रिप। रोशनी वाले रूट पर रहें।"],
      tip: ["Only ride if rested — safety first.", "तभी चलाएँ जब आराम किया हो — सुरक्षा पहले।"] },
  ],

  // ── Cab — Ola / Uber: airport, office commutes, nightlife. AC = works midday ──
  cab: [
    { id: "airport-early", time: "4:00 – 8:00 AM", startH: 4, endH: 8, mult: 1.9, demand: 0.85, rphr: 240,
      tag: "surge", tagText: ["1.9× airport", "1.9× एयरपोर्ट"], label: ["Airport & early runs", "एयरपोर्ट व जल्दी ट्रिप"],
      reason: ["Early flights mean long fixed-fare airport drops — the cleanest money of the day.", "सुबह की फ्लाइट यानी लंबी फिक्स्ड-किराया एयरपोर्ट ड्रॉप — दिन की सबसे साफ़ कमाई।"],
      position: ["Start near {residential} for airport pickups; queue at {airport} for arrivals.", "एयरपोर्ट पिकअप के लिए {residential} के पास शुरू करें; अराइवल के लिए {airport} पर कतार लगाएँ।"],
      hotspots: [
        { place: ["{airport}", "{airport}"], why: ["Early flight drops & arrivals", "सुबह फ्लाइट ड्रॉप व अराइवल"], heat: "peak" },
        { place: ["{residential}", "{residential}"], why: ["Scheduled airport pickups", "शेड्यूल एयरपोर्ट पिकअप"], heat: "high" },
      ],
      drivers: [["Early-morning flight schedule", "सुबह की फ्लाइट शेड्यूल"], ["Long fixed airport fares", "लंबे फिक्स्ड एयरपोर्ट किराए"]],
      traffic: ["Empty roads before 7 — fast long trips.", "7 बजे से पहले खाली सड़कें — तेज़ लंबी ट्रिप।"],
      tip: ["Take airport drops over short metered trips — fixed fares pay far better.", "छोटी मीटर ट्रिप से एयरपोर्ट ड्रॉप बेहतर — फिक्स्ड किराया ज़्यादा।"] },
    { id: "office-am", time: "8:00 – 10:30 AM", startH: 8, endH: 10.5, mult: 1.4, demand: 0.7, rphr: 190,
      tag: "steady", tagText: ["Office rush", "ऑफिस रश"], label: ["Office commute", "ऑफिस कम्यूट"],
      reason: ["Corporate commuters book rides to {office} — steady back-to-back trips.", "कॉर्पोरेट यात्री {office} की राइड बुक करते — स्थिर लगातार ट्रिप।"],
      position: ["Work {residential} → {office} routes.", "{residential} → {office} कॉरिडोर पर काम करें।"],
      hotspots: [
        { place: ["{office}", "{office}"], why: ["Corporate drop-offs", "कॉर्पोरेट ड्रॉप"], heat: "high" },
        { place: ["{metro}", "{metro}"], why: ["Last-mile from metro to office", "मेट्रो से ऑफिस तक last-mile"], heat: "good" },
      ],
      drivers: [["Office commute across NCR", "NCR भर ऑफिस कम्यूट"], ["Corporate account rides", "कॉर्पोरेट अकाउंट राइड"]],
      traffic: ["Heavy on Ring Road & NH-48 — charge waiting time on jams.", "रिंग रोड व NH-48 पर भारी — जाम पर वेटिंग टाइम लें।"],
      tip: ["Stay in the corporate belt; office accounts tip and rebook.", "कॉर्पोरेट इलाके में रहें; ऑफिस अकाउंट टिप व रीबुक करते।"] },
    { id: "mid-morning", time: "10:30 AM – 12:00 PM", startH: 10.5, endH: 12, mult: 1.1, demand: 0.5, rphr: 160,
      tag: "steady", tagText: ["Steady", "स्थिर"], label: ["Mid-morning runs", "देर सुबह ट्रिप"],
      reason: ["Business meetings, hotel checkouts and shopping trips keep steady fares between the rushes.", "बिज़नेस मीटिंग, होटल चेकआउट व शॉपिंग ट्रिप रश के बीच स्थिर किराए देते।"],
      position: ["Wait at {mall} and {office} ranks for business and shopping trips.", "बिज़नेस व शॉपिंग ट्रिप के लिए {mall} व {office} रैंक पर रहें।"],
      hotspots: [
        { place: ["{mall}", "{mall}"], why: ["Shoppers & hotel checkouts", "शॉपर व होटल चेकआउट"], heat: "good" },
        { place: ["{office}", "{office}"], why: ["Mid-morning business trips", "देर सुबह बिज़नेस ट्रिप"], heat: "good" },
      ],
      tip: ["Park in shade near a mall rank and take what comes — steady, low-stress fares.", "मॉल रैंक के पास छाँव में रुकें और जो आए लें — स्थिर, कम तनाव किराए।"] },
    { id: "midday", time: "12:00 – 4:00 PM", startH: 12, endH: 16, mult: 1.1, demand: 0.5, rphr: 150,
      tag: "steady", tagText: ["AC · steady", "AC · स्थिर"], label: ["Midday — malls & meetings", "दोपहर — मॉल व मीटिंग"],
      reason: ["Your AC cabin means you can keep earning in the heat — mall, hotel and meeting trips.", "आपकी AC कैब यानी गर्मी में भी कमाई — मॉल, होटल व मीटिंग ट्रिप।"],
      position: ["Wait at {mall} and hotel ranks for shoppers and business trips.", "शॉपर व बिज़नेस ट्रिप के लिए {mall} व होटल रैंक पर रहें।"],
      hotspots: [
        { place: ["{mall}", "{mall}"], why: ["Shoppers & lunch meetings", "शॉपर व लंच मीटिंग"], heat: "good" },
        { place: ["{office}", "{office}"], why: ["Midday business trips", "दोपहर बिज़नेस ट्रिप"], heat: "good" },
      ],
      drivers: [["Mall & hotel footfall", "मॉल व होटल भीड़"], ["Business & shopping trips", "बिज़नेस व शॉपिंग ट्रिप"]],
      traffic: ["Lighter midday roads — comfortable longer fares.", "दोपहर हल्की सड़कें — आरामदायक लंबे किराए।"],
      tip: ["You can work through the heat — but park in shade between trips to save fuel.", "आप गर्मी में काम कर सकते — पर तेल बचाने ट्रिप के बीच छाँव में पार्क करें।"] },
    { id: "pre-evening", time: "4:00 – 6:00 PM", startH: 16, endH: 18, mult: 1.3, demand: 0.62, rphr: 185,
      tag: "steady", tagText: ["Warming up", "बढ़ रहा"], label: ["Pre-evening pickup", "शाम से पहले"],
      reason: ["Early office leavers, school pickups and mall trips build before the evening surge.", "जल्दी निकलते ऑफिस लोग, स्कूल पिकअप व मॉल ट्रिप शाम सर्ज से पहले बढ़ते।"],
      position: ["Wait between {office} and {mall} as offices start to empty.", "ऑफिस खाली होते ही {office} व {mall} के बीच पहले से पोज़िशन लें।"],
      hotspots: [
        { place: ["{office}", "{office}"], why: ["Early leavers & client drops", "जल्दी निकलते लोग व क्लाइंट ड्रॉप"], heat: "high" },
        { place: ["{mall}", "{mall}"], why: ["Afternoon shoppers", "दोपहर शॉपर"], heat: "good" },
      ],
      tip: ["Get into the corporate belt before 6 PM so you're first for the office-return surge.", "6 बजे से पहले कॉर्पोरेट इलाके में पहुँचें ताकि ऑफिस-वापसी सर्ज में पहले हों।"] },
    { id: "office-pm", time: "6:00 – 9:30 PM", startH: 18, endH: 21.5, mult: 1.8, demand: 0.9, rphr: 235,
      tag: "surge", tagText: ["1.8× evening", "1.8× शाम"], label: ["Office return + dining", "ऑफिस वापसी + डाइनिंग"],
      reason: ["Office-return commute plus dinner & mall outings — demand surges everywhere.", "ऑफिस से वापसी के साथ डिनर व मॉल आउटिंग — हर जगह डिमांड सर्ज।"],
      position: ["Work {office} → {residential} and {mall} → home routes.", "{office} → {residential} व {mall} → घर रूट पर काम करें।"],
      hotspots: [
        { place: ["{office}", "{office}"], why: ["Homebound office rides peak", "घर वापसी ऑफिस राइड पीक"], heat: "peak" },
        { place: ["{mall}", "{mall}"], why: ["Evening shopping & dining trips", "शाम शॉपिंग व डाइनिंग ट्रिप"], heat: "high" },
        { place: ["{nightlife}", "{nightlife}"], why: ["Dinner-out pickups begin", "डिनर-आउट पिकअप शुरू"], heat: "high" },
      ],
      drivers: [["Office-return commute", "ऑफिस से वापसी"], ["Evening dining & mall trips", "शाम डाइनिंग व मॉल ट्रिप"]],
      traffic: ["Heaviest of the day — but that's where the surge lives.", "दिन का सबसे भारी — पर सर्ज यहीं है।"],
      tip: ["Avoid long cross-city trips in peak jams; nearer fares turn over faster.", "पीक जाम में लंबी क्रॉस-सिटी ट्रिप टालें; पास के किराए तेज़ बदलते।"] },
    { id: "night", time: "10:00 PM – 1:30 AM", startH: 22, endH: 25.5, mult: 2.0, demand: 0.75, rphr: 255,
      tag: "surge", tagText: ["2.0× night", "2.0× रात"], label: ["Nightlife & airport", "नाइटलाइफ़ व एयरपोर्ट"],
      reason: ["Club crowds heading home and late flight arrivals pay premium night fares.", "घर लौटती क्लब भीड़ व देर फ्लाइट अराइवल प्रीमियम नाइट किराए देते।"],
      position: ["Alternate {nightlife} pickups with {airport} arrival queues.", "{nightlife} पिकअप व {airport} अराइवल कतार के बीच बदलें।"],
      hotspots: [
        { place: ["{nightlife}", "{nightlife}"], why: ["Club & bar crowds heading home", "क्लब व बार भीड़ घर लौटती"], heat: "high" },
        { place: ["{airport}", "{airport}"], why: ["Late flight arrivals — premium fares", "देर फ्लाइट अराइवल — प्रीमियम किराए"], heat: "high" },
      ],
      drivers: [["Fewer cabs — premium night pay", "कम कैब — प्रीमियम नाइट कमाई"], ["Late flights & nightlife", "देर फ्लाइट व नाइटलाइफ़"]],
      traffic: ["Near-empty roads — fast trips. Stick to lit main routes.", "लगभग खाली सड़कें — तेज़ ट्रिप। रोशनी वाली मुख्य सड़कों पर रहें।"],
      tip: ["Only drive if rested — late nights pay well but safety first.", "तभी चलाएँ जब आराम किया हो — देर रात अच्छी कमाई पर सुरक्षा पहले।"] },
  ],

  // ── Auto-rickshaw: metro-feeder rush & markets. Open cabin → midday avoid ──
  auto: [
    { id: "morning-feeder", time: "7:00 – 10:00 AM", startH: 7, endH: 10, mult: 1.7, demand: 0.88, rphr: 175,
      tag: "surge", tagText: ["1.7× feeder", "1.7× फीडर"], label: ["Metro-feeder rush", "मेट्रो-फीडर रश"],
      reason: ["Commuters need short autos from {metro} to offices & homes — fast back-to-back fares.", "यात्रियों को {metro} से ऑफिस व घर तक छोटे ऑटो चाहिए — तेज़ लगातार किराए।"],
      position: ["Queue at {metro} gates and feed nearby {office} and {market}.", "{metro} गेट पर कतार लगाएँ व पास के {office} व {market} फीड करें।"],
      hotspots: [
        { place: ["{metro}", "{metro}"], why: ["First-mile commuters pour out", "first-mile यात्री निकलते"], heat: "peak" },
        { place: ["{market}", "{market}"], why: ["Shop staff & early shoppers", "दुकान स्टाफ़ व जल्दी शॉपर"], heat: "high" },
      ],
      drivers: [["Metro footfall at daily peak", "मेट्रो भीड़ दिन के पीक पर"], ["Office & school feeders", "ऑफिस व स्कूल फीडर"]],
      traffic: ["Heavy near metro gates — short hops turn over fastest.", "मेट्रो गेट के पास भारी — छोटी हॉप सबसे तेज़ बदलती।"],
      tip: ["Stick to the metro gate queue — steady short fares beat chasing the road.", "मेट्रो गेट कतार पर रहें — स्थिर छोटे किराए सड़क पर भागने से बेहतर।"] },
    { id: "mid-morning", time: "10:00 AM – 12:00 PM", startH: 10, endH: 12, mult: 1.1, demand: 0.5, rphr: 120,
      tag: "steady", tagText: ["Steady", "स्थिर"], label: ["Market & errands", "बाज़ार व काम"],
      reason: ["Shoppers, errands and clinic trips keep short fares moving after the metro rush dies down.", "मेट्रो रश के बाद शॉपर, छोटे काम व क्लिनिक ट्रिप छोटे किराए चलाते रहते।"],
      position: ["Hold {market} stands and feed nearby clinics & banks.", "{market} स्टैंड पर रहें व पास के क्लिनिक व बैंक फीड करें।"],
      hotspots: [
        { place: ["{market}", "{market}"], why: ["Shoppers & errand runs", "शॉपर व छोटे काम"], heat: "high" },
        { place: ["{metro}", "{metro}"], why: ["Steady off-peak feeders", "स्थिर ऑफ-पीक फीडर"], heat: "good" },
      ],
      tip: ["Quieter window — park in shade between fares to stay fresh for the heat.", "शांत विंडो — गर्मी के लिए ताज़ा रहने ट्रिप के बीच छाँव में रुकें।"] },
    { id: "midday", time: "12:00 – 3:30 PM", startH: 12, endH: 15.5, mult: 0.8, demand: 0.3, rphr: 90,
      tag: "avoid", tagText: ["Heat 46°C", "गर्मी 46°C"], label: ["Midday — avoid", "दोपहर — टालें"],
      reason: ["Open cabin + 46°C heat + few passengers — rest, hydrate and refuel instead of chasing low fares.", "खुली कैबिन + 46°C गर्मी + कम सवारी — कम किराए के पीछे भागने के बजाय आराम, पानी व तेल।"],
      position: ["Park in shade near {metro}; rest and refuel. Check the Heat tab for water points.", "{metro} के पास छाँव में पार्क करें; आराम व तेल भरें। पानी पॉइंट के लिए गर्मी टैब देखें।"],
      hotspots: [
        { place: ["Shaded auto stand", "छायादार ऑटो स्टैंड"], why: ["Cool off and rest", "ठंडे हों व आराम करें"], heat: "good" },
        { place: ["Free water points", "मुफ़्त पानी पॉइंट"], why: ["Rehydrate — see Heat tab", "पानी पिएँ — गर्मी टैब देखें"], heat: "good" },
      ],
      drivers: [["Heat index 46°C — high fatigue risk", "हीट इंडेक्स 46°C — थकान का खतरा"], ["Passengers stay indoors", "सवारी घर में रहती"]],
      traffic: ["Open roads, but riding now risks heatstroke for little pay.", "सड़कें खाली, पर अभी चलाना थोड़ी कमाई के लिए लू का खतरा।"],
      tip: ["Rest now so you're strong for the 5 PM feeder rush.", "अभी आराम करें ताकि 5 बजे फीडर रश के लिए मज़बूत हों।"] },
    { id: "afternoon", time: "3:30 – 5:00 PM", startH: 15.5, endH: 17, mult: 1.1, demand: 0.5, rphr: 120,
      tag: "steady", tagText: ["Warming up", "बढ़ रहा"], label: ["Afternoon market", "दोपहर बाज़ार"],
      reason: ["Heat eases and market & school-pickup trips return — ease back in before the evening rush.", "गर्मी कम होती व बाज़ार व स्कूल-पिकअप ट्रिप लौटते — शाम रश से पहले वापस शुरू करें।"],
      position: ["Start at {market} and school gates for short afternoon fares.", "छोटे दोपहर किराए के लिए {market} व स्कूल गेट पर शुरू करें।"],
      hotspots: [
        { place: ["{market}", "{market}"], why: ["Afternoon shoppers return", "दोपहर शॉपर लौटते"], heat: "high" },
        { place: ["{metro}", "{metro}"], why: ["Early commuters trickle out", "जल्दी यात्री निकलने लगते"], heat: "good" },
      ],
      tip: ["Hydrate first — then ease into the afternoon before the 5 PM feeder peak.", "पहले पानी पिएँ — फिर 5 बजे फीडर पीक से पहले दोपहर में उतरें।"] },
    { id: "evening-feeder", time: "5:00 – 9:00 PM", startH: 17, endH: 21, mult: 1.8, demand: 0.9, rphr: 190,
      tag: "surge", tagText: ["1.8× feeder", "1.8× फीडर"], label: ["Evening feeder peak", "शाम फीडर पीक"],
      reason: ["Office-return crowds need autos from {metro} to home — the day's busiest feeder window.", "ऑफिस से लौटती भीड़ को {metro} से घर तक ऑटो चाहिए — दिन की सबसे व्यस्त फीडर विंडो।"],
      position: ["Hold the {metro} exit and {market} stands.", "{metro} एग्ज़िट व {market} स्टैंड पर रहें।"],
      hotspots: [
        { place: ["{metro}", "{metro}"], why: ["Homebound last-mile peak", "घर वापसी last-mile पीक"], heat: "peak" },
        { place: ["{market}", "{market}"], why: ["Evening shoppers heading home", "शाम शॉपर घर लौटते"], heat: "high" },
      ],
      drivers: [["Office-return last-mile rush", "ऑफिस वापसी last-mile रश"], ["Evening market crowds", "शाम बाज़ार भीड़"]],
      traffic: ["Jammed main roads — stick to short metro-to-colony hops.", "मुख्य सड़कें जाम — छोटी मेट्रो-से-कॉलोनी हॉप रखें।"],
      tip: ["Position at the metro exit before 6 PM to catch the rush from the start.", "6 बजे से पहले मेट्रो एग्ज़िट पर रहें ताकि रश शुरू से पकड़ें।"] },
    { id: "night", time: "9:00 – 11:30 PM", startH: 21, endH: 23.5, mult: 1.4, demand: 0.55, rphr: 150,
      tag: "steady", tagText: ["Steady", "स्थिर"], label: ["Night market & dining", "रात बाज़ार व डाइनिंग"],
      reason: ["Late shoppers, diners and metro last-trains need rides home — steady fares with less competition.", "देर शॉपर, डाइनर व मेट्रो लास्ट-ट्रेन को घर की राइड चाहिए — कम मुकाबले के साथ स्थिर किराए।"],
      position: ["Cover {market} and {nightlife} until the last metro.", "लास्ट मेट्रो तक {market} व {nightlife} कवर करें।"],
      hotspots: [
        { place: ["{market}", "{market}"], why: ["Late shoppers heading home", "देर शॉपर घर लौटते"], heat: "high" },
        { place: ["{metro}", "{metro}"], why: ["Last-train passengers", "लास्ट-ट्रेन यात्री"], heat: "good" },
      ],
      drivers: [["Late diners & shoppers", "देर डाइनर व शॉपर"], ["Metro last-train crowd", "मेट्रो लास्ट-ट्रेन भीड़"]],
      traffic: ["Clearing roads — quick trips.", "साफ़ होती सड़कें — तेज़ ट्रिप।"],
      tip: ["Catch the last-metro crowd — they have few other options home.", "लास्ट-मेट्रो भीड़ पकड़ें — उनके पास घर के कम विकल्प।"] },
  ],

  // ── Bike taxi — Rapido / Uber Moto: weave through jams, short cheap hops ──
  biketx: [
    { id: "morning", time: "8:00 – 11:00 AM", startH: 8, endH: 11, mult: 1.7, demand: 0.85, rphr: 150,
      tag: "surge", tagText: ["1.7× morning", "1.7× सुबह"], label: ["Beat-the-jam commute", "जाम-तोड़ कम्यूट"],
      reason: ["Solo commuters pick bike-taxis to skip the jams to {office} and {metro} — quick cheap hops.", "अकेले यात्री जाम से बचने {office} व {metro} तक बाइक-टैक्सी लेते — तेज़ सस्ती हॉप।"],
      position: ["Wait at {metro} and {residential} gates for office-bound riders.", "ऑफिस जाने वालों के लिए {metro} व {residential} गेट पर रहें।"],
      hotspots: [
        { place: ["{metro}", "{metro}"], why: ["Last-mile to offices", "ऑफिस तक last-mile"], heat: "peak" },
        { place: ["{office}", "{office}"], why: ["Solo commuters in a hurry", "जल्दी में अकेले यात्री"], heat: "high" },
      ],
      drivers: [["Office commute beats the jam on two wheels", "दोपहिया पर ऑफिस कम्यूट जाम तोड़ता"], ["Metro feeders", "मेट्रो फीडर"]],
      traffic: ["Jams build by 9 — but a bike weaves through fastest.", "9 तक जाम बढ़ता — पर बाइक सबसे तेज़ निकलती।"],
      tip: ["Your edge is speed in traffic — stay on the main commute corridors.", "आपकी ताक़त ट्रैफ़िक में रफ़्तार — मुख्य कम्यूट कॉरिडोर पर रहें।"] },
    { id: "midday", time: "12:00 – 3:30 PM", startH: 12, endH: 15.5, mult: 0.8, demand: 0.3, rphr: 85,
      tag: "avoid", tagText: ["Heat 46°C", "गर्मी 46°C"], label: ["Midday — avoid", "दोपहर — टालें"],
      reason: ["Fully exposed on a bike in 46°C with few riders — rest in shade and hydrate, don't chase low fares.", "46°C में बाइक पर पूरी तरह खुले व कम सवारी — छाँव में आराम व पानी, कम किराए न पीछे भागें।"],
      position: ["Park in shade near {metro}; rest and drink water. See the Heat tab for water points.", "{metro} के पास छाँव में पार्क करें; आराम व पानी। पानी पॉइंट के लिए गर्मी टैब देखें।"],
      hotspots: [
        { place: ["Shaded waiting spot", "छायादार जगह"], why: ["Cool off and rest", "ठंडे हों व आराम करें"], heat: "good" },
        { place: ["Free water points", "मुफ़्त पानी पॉइंट"], why: ["Rehydrate — see Heat tab", "पानी पिएँ — गर्मी टैब देखें"], heat: "good" },
      ],
      drivers: [["Heat index 46°C — sunstroke risk", "हीट इंडेक्स 46°C — लू का खतरा"], ["Few riders booking midday", "दोपहर कम सवारी बुक करती"]],
      traffic: ["Open roads, but full sun exposure isn't worth the small fares.", "सड़कें खाली, पर पूरी धूप थोड़े किराए के लायक नहीं।"],
      tip: ["Rest now so you're sharp for the 5 PM rush.", "अभी आराम करें ताकि 5 बजे रश के लिए तैयार हों।"] },
    { id: "afternoon", time: "3:30 – 5:00 PM", startH: 15.5, endH: 17, mult: 1.1, demand: 0.5, rphr: 115,
      tag: "steady", tagText: ["Warming up", "बढ़ रहा"], label: ["Afternoon hops", "दोपहर हॉप"],
      reason: ["As the sun eases, college and market hops return — short cheap rides before the evening rush.", "धूप कम होते ही कॉलेज व बाज़ार हॉप लौटते — शाम रश से पहले छोटी सस्ती राइड।"],
      position: ["Wait near {market} and college gates for quick hops.", "तेज़ हॉप के लिए {market} व कॉलेज गेट के पास रहें।"],
      hotspots: [
        { place: ["{market}", "{market}"], why: ["Afternoon shoppers & students", "दोपहर शॉपर व छात्र"], heat: "high" },
        { place: ["{metro}", "{metro}"], why: ["Off-peak last-mile", "ऑफ-पीक last-mile"], heat: "good" },
      ],
      tip: ["Drink water before you start — the afternoon sun is still strong.", "शुरू करने से पहले पानी पिएँ — दोपहर की धूप अभी तेज़ है।"] },
    { id: "evening", time: "5:00 – 9:00 PM", startH: 17, endH: 21, mult: 1.8, demand: 0.9, rphr: 165,
      tag: "surge", tagText: ["1.8× evening", "1.8× शाम"], label: ["Evening rush peak", "शाम रश पीक"],
      reason: ["Office-return, college and metro crowds want quick cheap rides home — your busiest window.", "ऑफिस वापसी, कॉलेज व मेट्रो भीड़ को तेज़ सस्ती राइड चाहिए — आपकी सबसे व्यस्त विंडो।"],
      position: ["Hold {metro} exits and {office} gates as crowds pour out.", "भीड़ निकलते {metro} एग्ज़िट व {office} गेट पर रहें।"],
      hotspots: [
        { place: ["{metro}", "{metro}"], why: ["Homebound last-mile peak", "घर वापसी last-mile पीक"], heat: "peak" },
        { place: ["{office}", "{office}"], why: ["Office & college returns", "ऑफिस व कॉलेज वापसी"], heat: "high" },
      ],
      drivers: [["Office & college return rush", "ऑफिस व कॉलेज वापसी रश"], ["Metro last-mile crowd", "मेट्रो last-mile भीड़"]],
      traffic: ["Peak jams — your two-wheeler beats cars and autos here.", "पीक जाम — यहाँ आपका दोपहिया कार व ऑटो से तेज़।"],
      tip: ["Be at the metro exit before 6 to catch the rush from the start.", "6 से पहले मेट्रो एग्ज़िट पर रहें ताकि रश शुरू से पकड़ें।"] },
    { id: "night", time: "9:00 PM – 12:00 AM", startH: 21, endH: 24, mult: 1.4, demand: 0.5, rphr: 140,
      tag: "steady", tagText: ["Steady", "स्थिर"], label: ["Night short hops", "रात छोटी हॉप"],
      reason: ["Late diners and metro last-trains want quick rides home — steady fares, less competition.", "देर डाइनर व मेट्रो लास्ट-ट्रेन तेज़ राइड चाहते — कम मुकाबले के साथ स्थिर किराए।"],
      position: ["Cover {nightlife} and {metro} until the last train.", "लास्ट ट्रेन तक {nightlife} व {metro} कवर करें।"],
      hotspots: [
        { place: ["{nightlife}", "{nightlife}"], why: ["Diners & friends heading home", "डाइनर व दोस्त घर लौटते"], heat: "high" },
        { place: ["{metro}", "{metro}"], why: ["Last-train last-mile", "लास्ट-ट्रेन last-mile"], heat: "good" },
      ],
      drivers: [["Late diners heading home", "देर डाइनर घर लौटते"], ["Metro last-train crowd", "मेट्रो लास्ट-ट्रेन भीड़"]],
      traffic: ["Clear roads — fast hops. Stick to lit routes.", "साफ़ सड़कें — तेज़ हॉप। रोशनी वाले रूट पर रहें।"],
      tip: ["Only ride if rested — safety first at night.", "तभी चलाएँ जब आराम किया हो — रात में सुरक्षा पहले।"] },
  ],
};

export function windowsFor(profId: string, zone: Zone | null = null, now: Date = new Date(), lang: string = "en"): ShiftWindow[] {
  const hi = lang === "hi";
  const L = (zone && ZONE_LANDMARKS[zone.id]) || NCR_DEFAULT;
  const zoneId = zone?.id ?? null;
  const specs = PLAYBOOK[profId] ?? PLAYBOOK.food;
  const events = currentEvents(now, lang);
  const f = (b: Bi) => fillTokens(bi(b, hi), L, zoneId);

  return specs.map((s) => ({
    id: s.id,
    time: s.time,
    label: bi(s.label, hi),
    mult: s.mult,
    demand: s.demand,
    tag: s.tag,
    tagText: bi(s.tagText, hi),
    reason: f(s.reason),
    rphr: s.rphr,
    startH: s.startH,
    endH: s.endH,
    detail: {
      position: f(s.position),
      hotspots: s.hotspots.map((h) => ({ name: f(h.place), why: f(h.why), heat: h.heat })),
      // Append any live local events (date-aware) to the demand drivers.
      drivers: [...(s.drivers?.map(f) ?? []), ...events],
      traffic: s.traffic ? f(s.traffic) : "",
      tip: f(s.tip),
    },
  }));
}

// ── Earnings curve ─────────────────────────────────────────────

export interface EarningsWeek { w: number; base: number; proj: number; }
export interface EarningsCurve {
  weeks: EarningsWeek[]; start: number; target: number;
  peak: number; now: number; projected: number;
}

export function earningsCurve(profile: RideKamaoProfile): EarningsCurve {
  const profBase = PROFESSIONS.find((p) => p.id === profile.profession)?.base ?? 1200;
  const start  = Math.round(profBase * 6.4);
  const target = profile.weeklyTarget || Math.round(start * 1.5);
  const peak   = Math.max(target * 1.06, start * 1.62);
  const weeks: EarningsWeek[] = Array.from({ length: 8 }, (_, i) => {
    const t = i / 7;
    const ease = 1 - Math.pow(1 - t, 1.7);
    return { w: i + 1, proj: Math.round(start + (peak - start) * ease), base: Math.round(start * (1 + i * 0.012)) };
  });
  return { weeks, start, target, peak, now: start, projected: weeks[7].proj };
}

// ── Heat data ─────────────────────────────────────────────────

export const HEAT: HeatData = {
  level: "high", levelLabel: "HIGH", feelsLike: 46, air: 41,
  metrics: [
    { id: "aqi",  label: "AQI",      value: "183", cat: "Unhealthy", tone: "high" },
    { id: "temp", label: "Temp",      value: "43°", cat: "Very hot",  tone: "ext"  },
    { id: "hum",  label: "Humidity",  value: "38%", cat: "Moderate",  tone: "mod"  },
    { id: "uv",   label: "UV Index",  value: "9",   cat: "Very high", tone: "high" },
  ],
  hours: [
    { h:"6a", r:0 }, { h:"8a", r:0 }, { h:"10a", r:1 }, { h:"11a", r:2 },
    { h:"12p", r:2 }, { h:"1p", r:3 }, { h:"2p", r:3 }, { h:"3p", r:3 },
    { h:"4p", r:2 }, { h:"5p", r:1 }, { h:"6p", r:1 }, { h:"7p", r:0 },
    { h:"8p", r:0 }, { h:"9p", r:0 },
  ],
  fatigueHour: "2:30 PM",
  sattu: [
    { name: "Lajpat Nagar Auto Stand",  dist: "0.6 km", time: "11 AM – 4 PM", stock: "Cold water · ORS · Chaas" },
    { name: "CP Block-A Rider Point",   dist: "1.4 km", time: "10 AM – 5 PM", stock: "Cold water · Shade" },
    { name: "Nehru Place Metro Gate 3", dist: "2.1 km", time: "12 PM – 6 PM", stock: "Cold water · ORS" },
  ],
};

// Hindi view of the heat dashboard. Place names & numbers stay as-is; the
// descriptive parts (level, categories, stock) translate.
const HEAT_HI: HeatData = {
  ...HEAT,
  levelLabel: "तेज़",
  metrics: [
    { id: "aqi",  label: "AQI",      value: "183", cat: "अस्वस्थ",      tone: "high" },
    { id: "temp", label: "तापमान",   value: "43°", cat: "बहुत गर्म",    tone: "ext"  },
    { id: "hum",  label: "नमी",       value: "38%", cat: "मध्यम",        tone: "mod"  },
    { id: "uv",   label: "UV",        value: "9",   cat: "बहुत ज़्यादा", tone: "high" },
  ],
  fatigueHour: "2:30 दोपहर",
  sattu: [
    { name: "लाजपत नगर ऑटो स्टैंड",   dist: "0.6 km", time: "11 AM – 4 PM", stock: "ठंडा पानी · ORS · छाछ" },
    { name: "CP ब्लॉक-A राइडर पॉइंट",  dist: "1.4 km", time: "10 AM – 5 PM", stock: "ठंडा पानी · छाँव" },
    { name: "नेहरू प्लेस मेट्रो गेट 3", dist: "2.1 km", time: "12 PM – 6 PM", stock: "ठंडा पानी · ORS" },
  ],
};

export function getHeat(lang: string): HeatData {
  return lang === "hi" ? HEAT_HI : HEAT;
}

// ── Know Your Rights — multi-language ─────────────────────────

const RIGHTS_HI: RightsContent = {
  intro: "नमस्ते! मैं RideKamao साथी हूँ। गिग वर्कर के तौर पर आपके हक़ और कानून से जुड़ा कोई भी सवाल पूछिए — मैं आसान भाषा में जवाब दूँगा।",
  questions: [
    {
      q: "काम करते वक्त एक्सीडेंट हो गया तो?",
      a: "अगर ड्यूटी के दौरान दुर्घटना होती है तो आप मुआवज़े और इलाज के हक़दार हैं। सामाजिक सुरक्षा संहिता, 2020 के तहत प्लेटफ़ॉर्म एग्रीगेटर को गिग वर्कर्स के लिए दुर्घटना बीमा देना ज़रूरी है। तुरंत: (1) ऐप में incident रिपोर्ट करें, (2) FIR/मेडिकल पर्ची संभालें, (3) प्लेटफ़ॉर्म के बीमा क्लेम नंबर पर कॉल करें।",
      cites: ["Code on Social Security, 2020 · §114", "BOCW Act, 1996 · §22"],
    },
    {
      q: "PF और बीमा मेरा हक़ है क्या?",
      a: "हाँ। सामाजिक सुरक्षा संहिता, 2020 गिग और प्लेटफ़ॉर्म वर्कर्स को 'unorganised worker' मानती है — जीवन बीमा, स्वास्थ्य लाभ और वृद्धावस्था सुरक्षा का प्रावधान है। e-Shram पोर्टल पर रजिस्टर करना ज़रूरी है।",
      cites: ["Code on Social Security, 2020 · §§112–114", "e-Shram Registration"],
    },
    {
      q: "कंपनी बिना बताए मेरी ID ब्लॉक कर सकती है?",
      a: "बिना उचित कारण और सूचना के ID ब्लॉक करना अनुचित है। कंपनी को कारण बताना और अपील का मौका देना होता है। ब्लॉक होने पर: स्क्रीनशॉट लें, लिखित कारण माँगें, और grievance अधिकारी को मेल करें।",
      cites: ["Platform Contractor Agreement · Cl. 9", "Code on Social Security, 2020 · §112"],
    },
    {
      q: "क्या मुझे न्यूनतम कमाई की गारंटी है?",
      a: "फ़िलहाल केंद्रीय कानून सीधी न्यूनतम मज़दूरी तय नहीं करता, पर राजस्थान व कर्नाटक जैसे राज्यों ने गिग वर्कर कल्याण कानून बनाए हैं। अपने राज्य के गिग वर्कर बोर्ड में रजिस्टर करें।",
      cites: ["Rajasthan Platform-Based Gig Workers Act, 2023", "Karnataka Gig Workers Bill, 2024"],
    },
    {
      q: "प्लेटफ़ॉर्म मेरी rating गिरा सकता है?",
      a: "Rating system में transparency होनी चाहिए। अगर आपको लगता है rating unfair तरीके से गिराई गई है — प्लेटफ़ॉर्म के grievance cell में शिकायत करें और हर delivery के screenshots रखें।",
      cites: ["Consumer Protection (E-Commerce) Rules, 2020", "Code on Social Security, 2020 · §112"],
    },
  ],
};

const RIGHTS_EN: RightsContent = {
  intro: "Hello! I'm RideKamao Saathi. Ask me anything about your rights and laws as a gig worker — I'll answer in plain language.",
  questions: [
    {
      q: "What if I have an accident while working?",
      a: "If an accident occurs during duty, you're entitled to compensation and medical care. Under the Code on Social Security 2020, platform aggregators must provide accident insurance for gig workers. Immediately: (1) file an incident report in the app, (2) keep the FIR and medical receipt, (3) call the platform's insurance claim number.",
      cites: ["Code on Social Security, 2020 · §114", "BOCW Act, 1996 · §22"],
    },
    {
      q: "Am I entitled to PF and insurance?",
      a: "Yes. The Code on Social Security 2020 recognises gig and platform workers as 'unorganised workers' and provides for life & disability insurance, health and maternity benefits, and old-age protection. Registering on the e-Shram portal is mandatory — it gives you direct access to government schemes.",
      cites: ["Code on Social Security, 2020 · §§112–114", "e-Shram Registration"],
    },
    {
      q: "Can the company block my ID without notice?",
      a: "Blocking an ID without proper reason and notice is unfair. The platform contract spells out termination conditions — the company must state a reason and give you a chance to appeal. If blocked: take screenshots, demand written reasons in writing, and email the grievance officer.",
      cites: ["Platform Contractor Agreement · Cl. 9", "Code on Social Security, 2020 · §112"],
    },
    {
      q: "Is there a guaranteed minimum income?",
      a: "Central law doesn't directly set a minimum wage for gig workers yet, but states like Rajasthan and Karnataka have passed gig worker welfare laws with welfare levies and minimum protections. Register with your state's gig worker board to access benefits.",
      cites: ["Rajasthan Platform-Based Gig Workers Act, 2023", "Karnataka Gig Workers Bill, 2024"],
    },
    {
      q: "Can the platform unfairly drop my rating?",
      a: "The rating system must be transparent. If you believe your rating was dropped unfairly, file a complaint with the platform's grievance cell and keep screenshots of every delivery as evidence.",
      cites: ["Consumer Protection (E-Commerce) Rules, 2020", "Code on Social Security, 2020 · §112"],
    },
  ],
};

export const RIGHTS_CONTENT: Record<string, RightsContent> = {
  hi: RIGHTS_HI,
  en: RIGHTS_EN,
};

export function getRightsContent(lang: string): RightsContent {
  return RIGHTS_CONTENT[lang] ?? RIGHTS_CONTENT.en;
}

// ── Helpers ────────────────────────────────────────────────────

export function getProfession(id: string): Profession | undefined {
  return PROFESSIONS.find((p) => p.id === id);
}

export function demoProfile(): RideKamaoProfile {
  return { language: "hi", profession: "food", goals: ["earn", "heat", "target"], name: "Ramesh", email: "ramesh@email.com", weeklyTarget: 11000 };
}
