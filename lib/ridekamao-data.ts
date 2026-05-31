// RideKamao data layer — types, constants, zone-based shifts, multi-language rights

export interface Language { id: string; label: string; native: string; }
export interface Profession { id: string; title: string; sub: string; base: number; }
export interface Goal { id: string; title: string; sub: string; }

export interface ShiftWindow {
  time: string; label: string;
  mult: number; demand: number;
  tag: "surge" | "cool" | "steady" | "avoid";
  tagText: string; reason: string; rphr: number;
  zoneNote?: string;
}

export interface HeatMetric {
  id: string; label: string; value: string; cat: string;
  tone: "safe" | "mod" | "high" | "ext";
}

export interface SattuPoint { name: string; dist: string; time: string; stock: string; }

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

function zoneReason(base: string, zone: Zone | null, profId: string): string {
  if (!zone) return base;
  const z = zone.id;
  if (z === "gurgaon" && profId === "cab") return "DLF Cyber City offices open — corporate cab demand peaks now.";
  if (z === "noida" && profId === "food") return "Tech park canteens close — food app orders surge in Sector 18 & 62.";
  if (z === "cp" && profId === "auto") return "Metro commuters need auto feeders at Rajiv Chowk & Barakhamba.";
  if (z === "rohini") return "Sector market crowds thin out — good positioning time near Rohini West Metro.";
  if (z === "dwarka") return "Dwarka Expressway corporate corridor — steady demand with low competition.";
  return base;
}

export function windowsFor(profId: string, zone: Zone | null = null): ShiftWindow[] {
  const isAuto = profId === "auto";
  const isCab  = profId === "cab";
  const isFood = profId === "food" || profId === "qcom";

  return [
    {
      time: isCab ? "5:00 – 8:30 AM" : "6:00 – 9:30 AM",
      label: isCab ? "Airport & early office" : "Morning rush",
      mult: isCab ? 1.8 : 1.6, demand: isCab ? 0.82 : 0.86,
      tag: "cool", tagText: "Cool · 31°C",
      reason: zoneReason(
        isCab
          ? "Airport drops & early office runs pay the best fixed fares."
          : isAuto
            ? "Metro-feeder demand at Rajiv Chowk & Kashmere Gate is highest now."
            : "Office-hour orders + comfortable temperature before the heat builds.",
        zone, profId
      ),
      rphr: isCab ? 210 : isAuto ? 165 : 175,
    },
    {
      time: "10:00 AM – 12:00 PM",
      label: "Late morning peak",
      mult: 1.3, demand: 0.64,
      tag: "steady", tagText: "Steady",
      reason: zoneReason(
        isFood
          ? "Snack and grocery orders climb before the lunch surge begins."
          : "Low competition window — regulars rest, traffic clears after rush.",
        zone, profId
      ),
      rphr: 130,
    },
    {
      time: "12:00 – 3:30 PM",
      label: "Midday — avoid",
      mult: 0.8, demand: 0.35,
      tag: "avoid", tagText: "Heat 46°C",
      reason: "Heat index 46°C — high fatigue risk and low demand. Rest, hydrate, refuel your vehicle.",
      rphr: 80,
    },
    {
      time: "4:30 – 6:30 PM",
      label: "Pre-evening warm-up",
      mult: 1.3, demand: 0.62,
      tag: "steady", tagText: "Steady",
      reason: zoneReason(
        "Demand recovers as the day cools. Good time to pre-position near Connaught Place or your local hub.",
        zone, profId
      ),
      rphr: 145,
    },
    {
      time: "6:30 – 9:30 PM",
      label: "Evening commute peak",
      mult: 1.7, demand: 0.88,
      tag: "surge", tagText: "1.7× surge",
      reason: zoneReason(
        isAuto
          ? "Office return traffic — metro-to-home rides peak sharply."
          : "Evening commute + dinner orders — demand stays high across all zones.",
        zone, profId
      ),
      rphr: 195,
    },
    {
      time: "7:00 – 10:30 PM",
      label: "Dinner + event surge",
      mult: 2.1, demand: 0.97,
      tag: "surge", tagText: "2.1× surge",
      reason: zoneReason(
        isCab
          ? "Match-end crowd needs rides home — airport & stadium zones surge hard."
          : "IPL at Arun Jaitley Stadium ends ~10 PM — dinner orders spike across NCR.",
        zone, profId
      ),
      rphr: 240,
    },
    {
      time: "10:30 PM – 1:00 AM",
      label: "Late-night premium",
      mult: 1.9, demand: 0.70,
      tag: "surge", tagText: "1.9× surge",
      reason: zoneReason(
        isCab
          ? "Late airport runs and club-district pickups pay premium night fares."
          : "Fewer riders on road — late food orders and party crowds pay premium.",
        zone, profId
      ),
      rphr: 220,
    },
  ];
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
    { name: "Lajpat Nagar Auto Stand",  dist: "0.6 km", time: "11 AM – 4 PM", stock: "Sattu · ORS · Chaas" },
    { name: "CP Block-A Rider Point",   dist: "1.4 km", time: "10 AM – 5 PM", stock: "Sattu · Water" },
    { name: "Nehru Place Metro Gate 3", dist: "2.1 km", time: "12 PM – 6 PM", stock: "Sattu · ORS" },
  ],
};

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
