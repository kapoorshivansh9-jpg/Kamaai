// RideKamao data layer — types, constants, zone-based shifts, multi-language rights

export interface Language { id: string; label: string; native: string; }
export interface Profession { id: string; title: string; sub: string; base: number; }
export interface Goal { id: string; title: string; sub: string; }

export type WindowId =
  | "morning" | "late-morning" | "midday" | "pre-evening"
  | "evening" | "dinner" | "late-night";

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

// ── Shift windows (expanded, 7 slots) ─────────────────────────

function zoneReason(base: string, zone: Zone | null, profId: string, lang: string): string {
  if (!zone) return base;
  const hi = lang === "hi";
  const z = zone.id;
  if (z === "gurgaon" && profId === "cab") return hi ? "DLF साइबर सिटी ऑफिस खुलते हैं — कॉर्पोरेट कैब डिमांड अभी पीक पर।" : "DLF Cyber City offices open — corporate cab demand peaks now.";
  if (z === "noida" && profId === "food") return hi ? "टेक पार्क कैंटीन बंद होती हैं — सेक्टर 18 व 62 में फूड ऑर्डर सर्ज।" : "Tech park canteens close — food app orders surge in Sector 18 & 62.";
  if (z === "cp" && profId === "auto") return hi ? "मेट्रो यात्रियों को राजीव चौक व बारहखंभा पर ऑटो चाहिए।" : "Metro commuters need auto feeders at Rajiv Chowk & Barakhamba.";
  if (z === "rohini") return hi ? "सेक्टर मार्केट की भीड़ छँटती है — रोहिणी वेस्ट मेट्रो के पास अच्छी पोज़िशनिंग।" : "Sector market crowds thin out — good positioning time near Rohini West Metro.";
  if (z === "dwarka") return hi ? "द्वारका एक्सप्रेसवे कॉर्पोरेट कॉरिडोर — कम मुकाबले के साथ स्थिर डिमांड।" : "Dwarka Expressway corporate corridor — steady demand with low competition.";
  return base;
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

// ── Rich per-window guidance (positioning + live drivers + traffic) ──
function windowDetail(id: WindowId, profId: string, zone: Zone | null, now: Date, lang: string): WindowDetail {
  const L = (zone && ZONE_LANDMARKS[zone.id]) || NCR_DEFAULT;
  const isAuto = profId === "auto";
  const isCab  = profId === "cab";
  const isFood = profId === "food" || profId === "qcom";
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  const hi = lang === "hi";
  const pick = (en: string, h: string) => (hi ? h : en);

  switch (id) {
    case "morning":
      return {
        position: pick(`Head to ${L.metro} and nearby office gates before 8 AM.`, `8 बजे से पहले ${L.metro} और पास के ऑफिस गेट पर पहुँचें।`),
        hotspots: [
          { name: L.metro, why: pick("Commuters pour out for first-mile rides", "यात्री first-mile राइड के लिए निकलते हैं"), heat: "peak" },
          { name: L.office, why: isFood ? pick("Early breakfast & coffee orders", "जल्दी नाश्ता व कॉफ़ी ऑर्डर") : pick("Office drop-offs pay clean fixed fares", "ऑफिस ड्रॉप साफ़ फिक्स्ड किराए देते हैं"), heat: "high" },
          { name: pick("Residential complex gates", "सोसाइटी के गेट"), why: pick("First grocery & breakfast orders of the day", "दिन के पहले ग्रोसरी व नाश्ता ऑर्डर"), heat: "good" },
        ],
        drivers: [
          pick("Office commute begins across NCR", "NCR भर में ऑफिस आना-जाना शुरू"),
          pick("Metro footfall at its daily peak", "मेट्रो की भीड़ दिन के पीक पर"),
          isFood ? pick("Breakfast & chai orders climbing", "नाश्ता व चाय ऑर्डर बढ़ रहे") : pick("School & office drop-offs", "स्कूल व ऑफिस ड्रॉप"),
        ],
        traffic: pick("Light at 6 AM, building to heavy on Ring Road & NH-48 by 9 — ride early to dodge the jams.", "6 बजे हल्का, 9 बजे तक रिंग रोड व NH-48 पर भारी — जाम से बचने जल्दी निकलें।"),
        tip: isCab
          ? pick("Take airport drops first — fixed fares beat short metered trips.", "पहले एयरपोर्ट ड्रॉप लें — फिक्स्ड किराया छोटी मीटर ट्रिप से बेहतर।")
          : pick("Be in position 15 min before the 8 AM rush so you're first in the queue.", "8 बजे रश से 15 मिनट पहले पोज़िशन लें ताकि आप कतार में पहले हों।"),
      };
    case "late-morning":
      return {
        position: pick(`Stay near ${L.market} and quick-commerce dark stores — short, fast trips.`, `${L.market} और क्विक-कॉमर्स डार्क स्टोर के पास रहें — छोटी, तेज़ ट्रिप।`),
        hotspots: [
          { name: L.market, why: pick("Mid-morning shoppers and errands", "देर सुबह खरीदारी व छोटे काम"), heat: "high" },
          { name: isFood ? pick("Blinkit / Zepto dark stores", "Blinkit / Zepto डार्क स्टोर") : pick("Bank & clinic clusters", "बैंक व क्लिनिक इलाके"), why: isFood ? pick("Grocery orders rise before lunch", "लंच से पहले ग्रोसरी ऑर्डर बढ़ते") : pick("Appointment runs, low competition", "अपॉइंटमेंट ट्रिप, कम मुकाबला"), heat: "good" },
          { name: pick("Residential pockets", "रिहायशी इलाके"), why: pick("Quick snack & essentials orders", "झटपट स्नैक व ज़रूरी सामान ऑर्डर"), heat: "good" },
        ],
        drivers: [
          pick("Roads cleared after the rush hour", "रश के बाद सड़कें साफ़"),
          isFood ? pick("Grocery & snack orders rising", "ग्रोसरी व स्नैक ऑर्डर बढ़ रहे") : pick("Errand & appointment trips", "छोटे काम व अपॉइंटमेंट ट्रिप"),
          pick("Fewer riders online — less competition", "कम राइडर ऑनलाइन — कम मुकाबला"),
        ],
        traffic: pick("Clearest roads of the day — quick turnarounds and low fuel burn.", "दिन की सबसे साफ़ सड़कें — झटपट ट्रिप, कम तेल खर्च।"),
        tip: pick("Calm window for newer riders: light traffic, steady short trips to build a rhythm.", "नए राइडर के लिए शांत विंडो: हल्का ट्रैफ़िक, स्थिर छोटी ट्रिप से लय बनाएँ।"),
      };
    case "midday":
      return {
        position: pick("Don't ride — rest in shade and rehydrate. Check the Heat tab for the nearest Sattu point.", "न चलाएँ — छाँव में आराम करें और पानी पिएँ। पास के सत्तू पॉइंट के लिए गर्मी टैब देखें।"),
        hotspots: [
          { name: pick("Sattu & ORS points", "सत्तू व ORS पॉइंट"), why: pick("Free hydration — see the Heat tab map", "मुफ़्त पानी — गर्मी टैब का मैप देखें"), heat: "good" },
          { name: pick("Covered parking / metro shade", "ढकी पार्किंग / मेट्रो की छाँव"), why: pick("Cool off and refuel your vehicle", "ठंडा हों और गाड़ी में तेल भरवाएँ"), heat: "good" },
        ],
        drivers: [
          pick("Heat index 46°C — high fatigue risk", "हीट इंडेक्स 46°C — थकान का ज़्यादा खतरा"),
          pick("Demand drops as customers stay indoors", "ग्राहक घर में रहते हैं — डिमांड गिरती है"),
          pick("Surge pricing rarely covers the heat strain", "सर्ज किराया गर्मी की थकान की भरपाई कम ही करता है"),
        ],
        traffic: pick("Open roads, but riding now risks heatstroke — the small earnings aren't worth it.", "सड़कें खाली, पर अभी चलाना लू का खतरा — थोड़ी कमाई के लायक नहीं।"),
        tip: pick("Use this hour to eat, hydrate and rest so you're strong for the 2× evening surge.", "इस घंटे खाएँ, पानी पिएँ और आराम करें ताकि 2× शाम सर्ज के लिए तैयार रहें।"),
      };
    case "pre-evening":
      return {
        position: pick(`Pre-position between ${L.office} and ${L.market} as the day cools.`, `दिन ठंडा होते ही ${L.office} और ${L.market} के बीच पहले से पोज़िशन लें।`),
        hotspots: [
          { name: L.office, why: pick("Early office leavers & tea-break orders", "जल्दी निकलते ऑफिस लोग व चाय-ब्रेक ऑर्डर"), heat: "high" },
          { name: L.market, why: pick("Evening shopping starts to pick up", "शाम की खरीदारी शुरू होती है"), heat: "good" },
          { name: L.metro, why: pick("Commuter trickle before the 6:30 peak", "6:30 पीक से पहले हल्की यात्री भीड़"), heat: "good" },
        ],
        drivers: [
          pick("Temperature dropping — riders & customers return", "तापमान गिर रहा — राइडर व ग्राहक लौटते"),
          pick("Evening shopping begins", "शाम की खरीदारी शुरू"),
          pick("Pre-dinner snack orders", "डिनर से पहले स्नैक ऑर्डर"),
        ],
        traffic: pick("Building steadily — get in position before 6 PM gridlock locks the main roads.", "धीरे-धीरे बढ़ रहा — 6 बजे जाम से पहले मुख्य सड़कों पर पोज़िशन लें।"),
        tip: pick("Be set by 6 PM so you catch the surge the moment it starts at 6:30.", "6 बजे तक तैयार रहें ताकि 6:30 पर सर्ज शुरू होते ही पकड़ लें।"),
      };
    case "evening":
      return {
        position: pick(`Work ${L.office} → home routes and ${L.food}.`, `${L.office} → घर के रूट और ${L.food} पर काम करें।`),
        hotspots: [
          { name: L.office, why: pick("Office return — homebound rides peak", "ऑफिस वापसी — घर की राइड पीक पर"), heat: "peak" },
          { name: L.food, why: pick("Dinner orders ramping up fast", "डिनर ऑर्डर तेज़ी से बढ़ रहे"), heat: "high" },
          { name: L.metro, why: pick("Last-mile from metro to home", "मेट्रो से घर तक last-mile"), heat: "high" },
        ],
        drivers: [
          pick("Office-return commute across NCR", "NCR भर में ऑफिस से वापसी"),
          pick("Dinner orders rising", "डिनर ऑर्डर बढ़ रहे"),
          isWeekend ? pick("Weekend outings adding demand", "वीकेंड आउटिंग से डिमांड बढ़ी") : pick("Weekday homebound rush", "वर्किंग-डे की घर वापसी भीड़"),
        ],
        traffic: pick("Heaviest of the day — but that's where the surge lives. Take short hops over long cross-city trips.", "दिन का सबसे भारी — पर सर्ज यहीं है। लंबी क्रॉस-सिटी ट्रिप से छोटी हॉप बेहतर।"),
        tip: isAuto
          ? pick("Stay near metro exits — short feeder rides turn over fastest.", "मेट्रो एग्ज़िट के पास रहें — छोटी फीडर राइड सबसे तेज़ी से बदलती हैं।")
          : pick("Skip long airport-side trips now; short dinner deliveries pay more per hour.", "अभी लंबी एयरपोर्ट ट्रिप छोड़ें; छोटी डिनर डिलीवरी प्रति घंटा ज़्यादा देती हैं।"),
      };
    case "dinner":
      return {
        position: pick(`Camp near ${L.food} and Arun Jaitley Stadium gates.`, `${L.food} और अरुण जेटली स्टेडियम गेट के पास रहें।`),
        hotspots: [
          { name: L.food, why: pick("Peak dinner & dessert orders", "पीक डिनर व डेज़र्ट ऑर्डर"), heat: "peak" },
          { name: pick("Arun Jaitley Stadium gates", "अरुण जेटली स्टेडियम गेट"), why: pick("IPL match ends ~10 PM — huge ride demand", "IPL मैच ~10 बजे खत्म — भारी राइड डिमांड"), heat: "peak" },
          { name: L.nightlife, why: isWeekend ? pick("Weekend party crowds", "वीकेंड पार्टी भीड़") : pick("Late diners heading out", "देर से खाने निकलते लोग"), heat: "high" },
        ],
        drivers: [
          pick("Dinner rush at its peak", "डिनर रश पीक पर"),
          pick("IPL at Arun Jaitley Stadium ends ~10 PM", "अरुण जेटली स्टेडियम में IPL ~10 बजे खत्म"),
          isWeekend ? pick("Weekend party & dining crowds", "वीकेंड पार्टी व डाइनिंग भीड़") : pick("Weeknight dinner deliveries", "वीकनाइट डिनर डिलीवरी"),
        ],
        traffic: pick("Stadium-area roads jam after 9:45 — pre-position before the match ends, don't chase it after.", "स्टेडियम इलाके की सड़कें 9:45 के बाद जाम — मैच खत्म होने से पहले पोज़िशन लें, बाद में पीछे न भागें।"),
        tip: pick("Highest-paying window today. Stack dinner deliveries first, then catch match-end rides.", "आज की सबसे ज़्यादा कमाई वाली विंडो। पहले डिनर डिलीवरी करें, फिर मैच-एंड राइड पकड़ें।"),
      };
    case "late-night":
      return {
        position: pick(`Cover ${L.nightlife} and ${isCab ? "airport arrivals" : "late-food clusters"}.`, `${L.nightlife} और ${isCab ? "एयरपोर्ट अराइवल" : "देर रात फूड इलाके"} कवर करें।`),
        hotspots: [
          { name: L.nightlife, why: isWeekend ? pick("Club & bar crowds heading home", "क्लब व बार की भीड़ घर लौटती") : pick("Late diners & shift workers", "देर से खाने वाले व शिफ्ट वर्कर"), heat: "high" },
          { name: isCab ? pick("IGI Airport T1 / T3", "IGI एयरपोर्ट T1 / T3") : L.food, why: isCab ? pick("Late flights — premium fixed fares", "देर रात फ्लाइट — प्रीमियम फिक्स्ड किराए") : pick("Late-night cravings & supper orders", "देर रात की भूख व सपर ऑर्डर"), heat: "high" },
          { name: pick("Hospital & 24×7 store zones", "अस्पताल व 24×7 स्टोर इलाके"), why: pick("Steady essential runs all night", "रातभर स्थिर ज़रूरी ट्रिप"), heat: "good" },
        ],
        drivers: [
          pick("Few riders online — premium pay", "कम राइडर ऑनलाइन — प्रीमियम कमाई"),
          isWeekend ? pick("Weekend nightlife crowds", "वीकेंड नाइटलाइफ़ भीड़") : pick("Late-shift & supper orders", "देर शिफ्ट व सपर ऑर्डर"),
          isCab ? pick("Late airport arrivals", "देर रात एयरपोर्ट अराइवल") : pick("24×7 quick-commerce", "24×7 क्विक-कॉमर्स"),
        ],
        traffic: pick("Near-empty roads — the fastest trips of the day. Stick to lit main routes.", "लगभग खाली सड़कें — दिन की सबसे तेज़ ट्रिप। रोशनी वाली मुख्य सड़कों पर रहें।"),
        tip: pick("Surge holds longer with fewer riders, but only ride if you're rested — safety first.", "कम राइडर से सर्ज ज़्यादा देर टिकता है, पर तभी चलाएँ जब आराम किया हो — सुरक्षा पहले।"),
      };
  }
}

export function windowsFor(profId: string, zone: Zone | null = null, now: Date = new Date(), lang: string = "en"): ShiftWindow[] {
  const isAuto = profId === "auto";
  const isCab  = profId === "cab";
  const isFood = profId === "food" || profId === "qcom";
  const hi = lang === "hi";
  const pick = (en: string, h: string) => (hi ? h : en);

  const base: Array<Omit<ShiftWindow, "detail">> = [
    {
      id: "morning",
      time: isCab ? "5:00 – 8:30 AM" : "6:00 – 9:30 AM",
      label: isCab ? pick("Airport & early office", "एयरपोर्ट व जल्दी ऑफिस") : pick("Morning rush", "सुबह की भीड़"),
      startH: isCab ? 5 : 6, endH: isCab ? 8.5 : 9.5,
      mult: isCab ? 1.8 : 1.6, demand: isCab ? 0.82 : 0.86,
      tag: "cool", tagText: pick("Cool · 31°C", "ठंडा · 31°C"),
      reason: zoneReason(
        isCab
          ? pick("Airport drops & early office runs pay the best fixed fares.", "एयरपोर्ट ड्रॉप व जल्दी ऑफिस ट्रिप सबसे अच्छे फिक्स्ड किराए देते हैं।")
          : isAuto
            ? pick("Metro-feeder demand at Rajiv Chowk & Kashmere Gate is highest now.", "राजीव चौक व कश्मीरी गेट पर मेट्रो-फीडर डिमांड अभी सबसे ज़्यादा।")
            : pick("Office-hour orders + comfortable temperature before the heat builds.", "ऑफिस-टाइम ऑर्डर + गर्मी बढ़ने से पहले आरामदायक तापमान।"),
        zone, profId, lang
      ),
      rphr: isCab ? 210 : isAuto ? 165 : 175,
    },
    {
      id: "late-morning",
      time: "10:00 AM – 12:00 PM",
      label: pick("Late morning peak", "देर सुबह पीक"),
      startH: 10, endH: 12,
      mult: 1.3, demand: 0.64,
      tag: "steady", tagText: pick("Steady", "स्थिर"),
      reason: zoneReason(
        isFood
          ? pick("Snack and grocery orders climb before the lunch surge begins.", "लंच सर्ज से पहले स्नैक व ग्रोसरी ऑर्डर बढ़ते हैं।")
          : pick("Low competition window — regulars rest, traffic clears after rush.", "कम मुकाबले की विंडो — बाकी राइडर आराम करते हैं, रश के बाद ट्रैफ़िक साफ़।"),
        zone, profId, lang
      ),
      rphr: 130,
    },
    {
      id: "midday",
      time: "12:00 – 3:30 PM",
      label: pick("Midday — avoid", "दोपहर — टालें"),
      startH: 12, endH: 15.5,
      mult: 0.8, demand: 0.35,
      tag: "avoid", tagText: pick("Heat 46°C", "गर्मी 46°C"),
      reason: pick("Heat index 46°C — high fatigue risk and low demand. Rest, hydrate, refuel your vehicle.", "हीट इंडेक्स 46°C — थकान का ज़्यादा खतरा और कम डिमांड। आराम करें, पानी पिएँ, गाड़ी में तेल भरवाएँ।"),
      rphr: 80,
    },
    {
      id: "pre-evening",
      time: "4:30 – 6:30 PM",
      label: pick("Pre-evening warm-up", "शाम से पहले की तैयारी"),
      startH: 16.5, endH: 18.5,
      mult: 1.3, demand: 0.62,
      tag: "steady", tagText: pick("Steady", "स्थिर"),
      reason: zoneReason(
        pick("Demand recovers as the day cools. Good time to pre-position near Connaught Place or your local hub.", "दिन ठंडा होते ही डिमांड लौटती है। कनॉट प्लेस या अपने लोकल हब के पास पहले से पोज़िशन लेने का अच्छा समय।"),
        zone, profId, lang
      ),
      rphr: 145,
    },
    {
      id: "evening",
      time: "6:30 – 9:30 PM",
      label: pick("Evening commute peak", "शाम की भीड़ पीक"),
      startH: 18.5, endH: 21.5,
      mult: 1.7, demand: 0.88,
      tag: "surge", tagText: pick("1.7× surge", "1.7× सर्ज"),
      reason: zoneReason(
        isAuto
          ? pick("Office return traffic — metro-to-home rides peak sharply.", "ऑफिस से लौटती भीड़ — मेट्रो-से-घर राइड तेज़ी से पीक पर।")
          : pick("Evening commute + dinner orders — demand stays high across all zones.", "शाम की भीड़ + डिनर ऑर्डर — सभी ज़ोन में डिमांड ऊँची रहती है।"),
        zone, profId, lang
      ),
      rphr: 195,
    },
    {
      id: "dinner",
      time: "7:00 – 10:30 PM",
      label: pick("Dinner + event surge", "डिनर + इवेंट सर्ज"),
      startH: 19, endH: 22.5,
      mult: 2.1, demand: 0.97,
      tag: "surge", tagText: pick("2.1× surge", "2.1× सर्ज"),
      reason: zoneReason(
        isCab
          ? pick("Match-end crowd needs rides home — airport & stadium zones surge hard.", "मैच खत्म होते भीड़ को घर की राइड चाहिए — एयरपोर्ट व स्टेडियम ज़ोन तेज़ सर्ज।")
          : pick("IPL at Arun Jaitley Stadium ends ~10 PM — dinner orders spike across NCR.", "अरुण जेटली स्टेडियम में IPL ~10 बजे खत्म — पूरे NCR में डिनर ऑर्डर बढ़ते हैं।"),
        zone, profId, lang
      ),
      rphr: 240,
    },
    {
      id: "late-night",
      time: "10:30 PM – 1:00 AM",
      label: pick("Late-night premium", "देर रात प्रीमियम"),
      startH: 22.5, endH: 25,
      mult: 1.9, demand: 0.70,
      tag: "surge", tagText: pick("1.9× surge", "1.9× सर्ज"),
      reason: zoneReason(
        isCab
          ? pick("Late airport runs and club-district pickups pay premium night fares.", "देर रात एयरपोर्ट ट्रिप व क्लब-इलाके पिकअप प्रीमियम नाइट किराए देते हैं।")
          : pick("Fewer riders on road — late food orders and party crowds pay premium.", "सड़क पर कम राइडर — देर रात फूड ऑर्डर व पार्टी भीड़ प्रीमियम देती है।"),
        zone, profId, lang
      ),
      rphr: 220,
    },
  ];

  // Attach rich, click-to-expand guidance to each window.
  return base.map((w) => ({ ...w, detail: windowDetail(w.id, profId, zone, now, lang) }));
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
