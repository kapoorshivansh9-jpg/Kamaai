// RideKamao data layer — types, constants, and calculation functions

export interface Language {
  id: string;
  label: string;
  native: string;
}

export interface Profession {
  id: string;
  icon: string;
  title: string;
  sub: string;
  base: number;
}

export interface Goal {
  id: string;
  icon: string;
  title: string;
  sub: string;
}

export interface ShiftWindow {
  time: string;
  label: string;
  mult: number;
  demand: number;
  tag: "surge" | "cool" | "steady";
  tagText: string;
  reason: string;
  rphr: number;
}

export interface AvoidWindow {
  time: string;
  reason: string;
}

export interface EarningsWeek {
  w: number;
  base: number;
  proj: number;
}

export interface EarningsCurve {
  weeks: EarningsWeek[];
  start: number;
  target: number;
  peak: number;
  now: number;
  projected: number;
}

export interface HeatMetric {
  id: string;
  icon: string;
  label: string;
  value: string;
  cat: string;
  tone: "safe" | "mod" | "high" | "ext";
}

export interface HeatHour {
  h: string;
  r: 0 | 1 | 2 | 3;
}

export interface SattuPoint {
  name: string;
  dist: string;
  time: string;
  stock: string;
}

export interface HeatData {
  level: string;
  levelLabel: string;
  feelsLike: number;
  air: number;
  metrics: HeatMetric[];
  hours: HeatHour[];
  fatigueHour: string;
  sattu: SattuPoint[];
}

export interface RightsQA {
  q: string;
  a: string;
  cites: string[];
}

export interface RideKamaoProfile {
  language: string;
  profession: string;
  goals: string[];
  name: string;
  email: string;
  weeklyTarget: number;
}

// ── Static data ────────────────────────────────────────────────

export const LANGUAGES: Language[] = [
  { id: "en", label: "English", native: "English" },
  { id: "hi", label: "Hindi",   native: "हिन्दी" },
  { id: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { id: "bn", label: "Bengali", native: "বাংলা" },
  { id: "ta", label: "Tamil",   native: "தமிழ்" },
  { id: "mr", label: "Marathi", native: "मराठी" },
];

export const PROFESSIONS: Profession[] = [
  { id: "food",   icon: "🛵",  title: "Food delivery rider",   sub: "Zomato · Swiggy",               base: 1180 },
  { id: "auto",   icon: "🛺",  title: "Auto-rickshaw driver",  sub: "Street & app hailing",           base: 1320 },
  { id: "biketx", icon: "🏍️", title: "Bike taxi rider",        sub: "Rapido · Uber Moto",             base: 1090 },
  { id: "cab",    icon: "🚗",  title: "Cab driver",             sub: "Ola · Uber",                     base: 1620 },
  { id: "qcom",   icon: "📦",  title: "Quick-commerce",         sub: "Blinkit · Zepto · Instamart",    base: 1240 },
];

export const GOALS: Goal[] = [
  { id: "earn",    icon: "📈", title: "Maximize daily earnings",   sub: "Squeeze the best ₹ from every hour" },
  { id: "target",  icon: "🎯", title: "Hit a weekly income target", sub: "Plan backwards from a number" },
  { id: "heat",    icon: "☀️", title: "Avoid heat · stay safe",    sub: "Dodge dangerous afternoon hours" },
  { id: "traffic", icon: "⚡", title: "Avoid traffic & long trips", sub: "Fewer dead kilometres" },
];

export const AVOID_WINDOW: AvoidWindow = {
  time: "12:00 – 3:30 PM",
  reason: "Heat index 46°C — high fatigue & low demand. Rest, hydrate, refuel.",
};

export const HEAT: HeatData = {
  level: "high",
  levelLabel: "HIGH",
  feelsLike: 46,
  air: 41,
  metrics: [
    { id: "aqi",  icon: "💨", label: "AQI",      value: "183", cat: "Unhealthy", tone: "high" },
    { id: "temp", icon: "☀️", label: "Temp",      value: "43°", cat: "Very hot",  tone: "ext"  },
    { id: "hum",  icon: "💧", label: "Humidity",  value: "38%", cat: "Moderate",  tone: "mod"  },
    { id: "uv",   icon: "🔥", label: "UV index",  value: "9",   cat: "Very high", tone: "high" },
  ],
  hours: [
    { h: "6a", r: 0 }, { h: "8a", r: 0 }, { h: "10a", r: 1 }, { h: "11a", r: 2 },
    { h: "12p", r: 2 }, { h: "1p", r: 3 }, { h: "2p", r: 3 }, { h: "3p", r: 3 },
    { h: "4p", r: 2 }, { h: "5p", r: 1 }, { h: "6p", r: 1 }, { h: "7p", r: 0 },
    { h: "8p", r: 0 }, { h: "9p", r: 0 },
  ],
  fatigueHour: "2:30 PM",
  sattu: [
    { name: "Lajpat Nagar Auto Stand",  dist: "0.6 km", time: "11 AM – 4 PM", stock: "Sattu · ORS · Chaas" },
    { name: "CP Block-A Rider Point",   dist: "1.4 km", time: "10 AM – 5 PM", stock: "Sattu · Water" },
    { name: "Nehru Place Metro Gate 3", dist: "2.1 km", time: "12 PM – 6 PM", stock: "Sattu · ORS" },
  ],
};

export const KYR_INTRO =
  "नमस्ते! मैं RideKamao साथी हूँ। गिग वर्कर के तौर पर आपके हक़ और कानून से जुड़ा कोई भी सवाल पूछिए — मैं आसान भाषा में जवाब दूँगा।";

export const KYR_QUESTIONS: RightsQA[] = [
  {
    q: "काम करते वक्त एक्सीडेंट हो गया तो?",
    a: "अगर ड्यूटी के दौरान दुर्घटना होती है तो आप मुआवज़े और इलाज के हक़दार हैं। सामाजिक सुरक्षा संहिता, 2020 के तहत प्लेटफ़ॉर्म एग्रीगेटर को गिग वर्कर्स के लिए दुर्घटना बीमा देना ज़रूरी है। तुरंत: (1) ऐप में incident रिपोर्ट करें, (2) FIR/मेडिकल पर्ची संभालें, (3) प्लेटफ़ॉर्म के बीमा क्लेम नंबर पर कॉल करें।",
    cites: ["Code on Social Security, 2020 · §114", "BOCW Act, 1996 · §22"],
  },
  {
    q: "PF और बीमा मेरा हक़ है क्या?",
    a: "हाँ। सामाजिक सुरक्षा संहिता, 2020 गिग और प्लेटफ़ॉर्म वर्कर्स को 'unorganised worker' मानती है और इनके लिए जीवन व विकलांगता बीमा, स्वास्थ्य और मातृत्व लाभ, तथा वृद्धावस्था सुरक्षा की योजनाओं का प्रावधान करती है। e-Shram पोर्टल पर रजिस्टर करना ज़रूरी है।",
    cites: ["Code on Social Security, 2020 · §§112–114", "e-Shram Registration"],
  },
  {
    q: "कंपनी बिना बताए मेरी ID ब्लॉक कर सकती है?",
    a: "बिना उचित कारण और बिना सूचना के अचानक ID ब्लॉक करना अनुचित है। प्लेटफ़ॉर्म कॉन्ट्रैक्टर एग्रीमेंट में 'termination' की शर्तें लिखी होती हैं — कंपनी को कारण बताना और अपील का मौका देना होता है। ब्लॉक होने पर: स्क्रीनशॉट लें, लिखित कारण माँगें, और grievance अधिकारी को मेल करें।",
    cites: ["Platform Contractor Agreement · Cl. 9", "Code on Social Security, 2020 · §112"],
  },
  {
    q: "क्या मुझे न्यूनतम कमाई की गारंटी है?",
    a: "फ़िलहाल केंद्रीय कानून गिग वर्कर के लिए सीधी 'न्यूनतम मज़दूरी' तय नहीं करता, पर राजस्थान व कर्नाटक जैसे राज्यों ने गिग वर्कर कल्याण कानून बनाए हैं। आप अपने राज्य के गिग वर्कर बोर्ड में रजिस्टर करके लाभ ले सकते हैं।",
    cites: ["Rajasthan Platform-Based Gig Workers Act, 2023", "Karnataka Gig Workers Bill, 2024"],
  },
];

// ── Calculation functions ──────────────────────────────────────

export function windowsFor(profId: string): ShiftWindow[] {
  const windows: ShiftWindow[] = [
    {
      time: "6:30 – 9:30 AM",
      label: "Morning rush",
      mult: 1.6,
      demand: 0.86,
      tag: "cool",
      tagText: "Cool · 31°C",
      reason: "Office-hour orders + comfortable temperature before the heat builds.",
      rphr: 175,
    },
    {
      time: "7:00 – 10:30 PM",
      label: "Dinner + match peak",
      mult: 2.1,
      demand: 0.97,
      tag: "surge",
      tagText: "2.1× surge",
      reason: "IPL final at Arun Jaitley Stadium ends ~10 PM — dinner orders spike across NCR.",
      rphr: 240,
    },
    {
      time: "4:30 – 6:00 PM",
      label: "Pre-evening warm-up",
      mult: 1.3,
      demand: 0.62,
      tag: "steady",
      tagText: "Steady",
      reason: "Demand recovers as the day cools. Good time to pre-position near Connaught Place.",
      rphr: 140,
    },
  ];

  if (profId === "cab") {
    windows[1].reason = "Match-end crowd needs rides home — airport & stadium zones surge hard.";
    windows[0].time = "5:30 – 8:30 AM";
    windows[0].reason = "Airport drops & early office runs pay the best fixed fares.";
  }
  if (profId === "auto") {
    windows[0].reason = "Metro-feeder demand at Rajiv Chowk & Kashmere Gate is highest now.";
  }
  return windows;
}

export function earningsCurve(profile: RideKamaoProfile): EarningsCurve {
  const profBase = PROFESSIONS.find((p) => p.id === profile.profession)?.base ?? 1200;
  const start = Math.round(profBase * 6.4);
  const target = profile.weeklyTarget || Math.round(start * 1.5);
  const peak = Math.max(target * 1.06, start * 1.62);
  const weeks: EarningsWeek[] = [];
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const ease = 1 - Math.pow(1 - t, 1.7);
    const proj = Math.round(start + (peak - start) * ease);
    const base = Math.round(start * (1 + i * 0.012));
    weeks.push({ w: i + 1, base, proj });
  }
  return { weeks, start, target, peak, now: start, projected: weeks[7].proj };
}

export function getProfession(id: string): Profession | undefined {
  return PROFESSIONS.find((p) => p.id === id);
}

export function demoProfile(): RideKamaoProfile {
  return {
    language: "hi",
    profession: "food",
    goals: ["earn", "heat", "target"],
    name: "Ramesh",
    email: "ramesh@email.com",
    weeklyTarget: 11000,
  };
}
