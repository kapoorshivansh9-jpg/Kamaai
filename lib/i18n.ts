"use client";

// RideKamao i18n — full-interface translation.
// Hindi + English are fully translated; the other languages (pa/bn/ta/mr)
// fall back to English UI for now (the Rights chatbot still answers in them).

import { useProfile } from "./ridekamao-profile";
import { PROFESSIONS, GOALS } from "./ridekamao-data";

const UI_LANGS = ["en", "hi", "pa", "bn", "ta", "mr"] as const;
export type UILang = (typeof UI_LANGS)[number];

/** Map any stored language to a supported UI language (English fallback). */
export function resolveLang(lang?: string | null): UILang {
  return (UI_LANGS as readonly string[]).includes(lang ?? "") ? (lang as UILang) : "en";
}

const LOCALE: Record<UILang, string> = {
  en: "en-IN", hi: "hi-IN", pa: "pa-IN", bn: "bn-IN", ta: "ta-IN", mr: "mr-IN",
};
/** Intl locale tag for the UI language. */
export function localeTag(lang: string): string {
  return LOCALE[resolveLang(lang)];
}

// ── Dictionary ────────────────────────────────────────────────
const en = {
  // nav
  "nav.home": "Home", "nav.shifts": "Shifts", "nav.heat": "Heat", "nav.rights": "Rights", "nav.profile": "Profile",

  // home
  "home.goodMorning": "Good morning,", "home.goodAfternoon": "Good afternoon,", "home.goodEvening": "Good evening,",
  "home.viewPlan": "View today's plan",
  "home.kicker": "Gig workers · Delhi NCR",
  "home.heroTitle1": "Ride smart.", "home.heroTitle2": "Earn more.",
  "home.heroSub": "Smart shift plans — beat the heat, know your rights.",
  "home.cta": "Get personalised plans",
  "home.features": "Features",
  "home.f.shift": "Shift Planner", "home.f.shiftDesc": "Best windows to ride today", "home.f.shiftTag": "Live",
  "home.f.heat": "Heat Safety", "home.f.heatDesc": "AQI · fatigue hour · hydration points", "home.f.heatTag": "HIGH today",
  "home.f.rights": "Know Your Rights", "home.f.rightsDesc": "Legal help in your language", "home.f.rightsTag": "5 topics",
  "home.tip": "Updated with live demand & weather · Delhi NCR",
  "common.rider": "Rider", "common.ncr": "Delhi NCR",

  // shifts
  "shifts.title": "Shift Planner",
  "loc.locating": "Locating…", "loc.located": "Located", "loc.ncr": "Delhi NCR",
  "loc.promptTitle": "Turn on location", "loc.promptSub": "Get area-level picks and real places near you — without it the plan stays generic.", "loc.enable": "Enable",
  "shifts.top3": "Today's top 3 windows", "shifts.projected": "projected",
  "shifts.workWindow": "Work window", "shifts.hrs": "hrs", "shifts.vsUsual": "vs usual",
  "shifts.showingSurge": "Showing surge data for",
  "shifts.liveSpots": "Live spots near you", "shifts.liveSpotsSub": "Real nearby places from OpenStreetMap · tap for directions",
  "shifts.trafficNow": "Traffic now", "traffic.light": "Light", "traffic.moderate": "Moderate", "traffic.heavy": "Heavy",
  "shifts.trafficHeavyTip": "Heavy traffic near you — prefer short hops and charge for waiting time.",
  "shifts.allWindows": "All windows today",
  "shifts.ride": "ride", "shifts.avoid": "avoid",
  "shifts.earningsOutlook": "Earnings outlook", "shifts.earningsProjection": "Earnings projection",
  "shifts.eightWeeks": "8 weeks with RideKamao", "shifts.nowWeek": "Now / week", "shifts.week8": "Week 8",
  "shifts.perHour": "per hour", "shifts.whereWhy": "Where to be & why now",
  "shifts.now": "NOW", "shifts.avoidBadge": "AVOID", "shifts.rightNow": "RIGHT NOW",
  // detail panel
  "d.whereToBe": "Where to be", "d.bestSpots": "Best spots right now",
  "d.whyGood": "Why it's good now", "d.traffic": "Traffic",
  "d.cityZones": "Busy areas to head to", "d.busyZone": "Busy area · tap for map",
  "fb.q": "Busy now?", "fb.yes": "Busy", "fb.no": "Quiet", "fb.thanks": "Thanks!", "fb.usuallyBusy": "Riders say busy", "fb.oftenQuiet": "Riders say quiet", "fb.mixed": "Mixed reports",
  "d.areasNear": "Areas near you (within 5 km)", "shifts.heatMidday": "Peak heat 12–3:30 PM — drink water every 20 min, rest in shade, wear light clothes.", "d.lookFor": "Stand near, right now",
  "d.peak": "Peak", "d.high": "High", "d.good": "Good",

  // heat
  "heat.title": "Heat Safety", "heat.updated": "Updated", "heat.refreshes": "refreshes hourly · Delhi NCR",
  "heat.indexNcr": "Heat Safety Index · Delhi NCR", "heat.takeBreaks": "Take regular breaks and hydrate",
  "heat.feelsLike": "feels like", "heat.rightNow": "Right now", "heat.planBreaks": "Plan your breaks",
  "heat.fatigue": "Projected fatigue hour", "heat.fatigueSub": "When heat strain peaks for your body",
  "heat.safe": "Safe", "heat.caution": "Caution", "heat.high": "High", "heat.extreme": "Extreme",
  "heat.sattu": "Free water points", "heat.nearby": "nearby", "heat.mapLive": "MAP · LIVE",
  "heat.tapPin": "Tap a pin to see what's on offer", "heat.you": "You", "heat.directions": "Directions", "heat.openNow": "Open now",
  "heat.beat": "Beat the heat today",
  "heat.beatBody": "Drink 1 glass water every 30 min · carry ORS · park in shade · wear light cotton. Skip the 12–3:30 PM window.",
  "heat.avoidBanner": "Avoid riding 12:00 – 3:30 PM today. Heat index: 46°C",
  "heat.m.aqi": "AQI", "heat.m.temp": "Temp", "heat.m.hum": "Humidity", "heat.m.uv": "UV Index",

  // onboarding
  "ob.tagline": "राइड करो · कमाओ · आगे बढ़ो",
  "ob.heroTitle": "Ride smart,\nearn more.",
  "ob.chooseLang": "Choose your language · भाषा",
  "ob.getStarted": "Get started",
  "ob.continue": "Continue", "ob.buildPlan": "Build my plan",
  "ob.step": "Step", "ob.of3": "/3",
  "ob.s1.title": "What do you ride?", "ob.s1.sub": "We tune every recommendation to how you earn.",
  "ob.s2.title": "What matters most?", "ob.s2.sub": "Pick any that fit — your plan is built around these.",
  "ob.s3.title": "Your details", "ob.s3.sub": "Your daily plan and earnings report — straight to your inbox each morning.",
  "ob.name": "Your name", "ob.namePh": "e.g. Ramesh Kumar", "ob.email": "Email", "ob.emailPh": "you@email.com",
  "ob.weeklyTarget": "Weekly income target",
  "ob.building": "Building your plan…", "ob.fewSeconds": "Just a few seconds",
  "ob.gen1": "Reading today's Delhi NCR weather & AQI", "ob.gen2": "Scanning local events — weekends & festivals",
  "ob.gen3": "Matching surge history to your zone", "ob.gen4": "Building your personalised shift plan",

  // profile sheet
  "pf.yours": "Your Profile", "pf.setup": "Set Up Profile",
  "pf.profession": "Profession", "pf.language": "Language", "pf.weeklyTarget": "Weekly Target", "pf.goals": "Goals",
  "pf.change": "Change", "pf.editAll": "Edit all preferences", "pf.reset": "Reset & start over",
  "pf.setupBlurb": "Set up your rider profile to get personalised shift plans, location-based surge alerts, and earnings projections.",
  "pf.perWeek": "/ week",
  "pf.signedInGoogle": "Signed in with Google",
  "pf.signInGoogle": "Sign in with Google",
  "pf.signOut": "Sign out",
  // growth / trust features
  "home.share": "Share on WhatsApp",
  "home.install": "Install app",
  "home.installHint": "Add to home screen · works offline · tiny data",
  "common.estimated": "estimated",
  "heat.live": "Live", "heat.sample": "Sample data",
  "heat.safety": "Safety", "heat.call112": "Call 112", "heat.nearestHospital": "Nearest hospital",
  "share.msg": "RideKamao — smart shift plans for Delhi NCR riders. Beat the heat, earn more, know your rights:",
  "ob.useGoogle": "Continue with Google", "ob.usingGoogle": "Using your Google account", "ob.orType": "or enter your details",
  "heat.waterPoint": "Drinking water", "heat.noWater": "No mapped water points within 5 km — showing sample points.",
  "heat.addWater": "+ Add a water point here", "heat.addWaterPrompt": "Name this water point (e.g. petrol pump, temple, shop):", "heat.added": "Added — thank you!",
  "earn.title": "Earnings", "earn.sub": "Stays private on your phone", "earn.today": "Log today", "earn.amount": "Amount earned (₹)", "earn.hours": "Hours worked", "earn.save": "Save", "earn.thisWeek": "This week", "earn.target": "Weekly target", "earn.noEntries": "No entries yet — log your first day above.", "earn.perHr": "/hr", "earn.recent": "Recent days", "earn.open": "Log earnings", "earn.expenses": "Expenses (₹)", "earn.expensesHint": "fuel · recharge · repairs", "earn.net": "Net", "earn.gross": "Gross", "earn.costs": "costs", "earn.platform": "Platform", "earn.other": "Other", "earn.edit": "Edit", "earn.delete": "Delete", "earn.update": "Update entry", "earn.cancel": "Cancel", "earn.deleteConfirm": "Delete this entry?", "earn.netThisWeek": "Net this week", "earn.byPlatform": "By platform", "earn.last7": "Last 7 days", "earn.bestDay": "Best day", "earn.avgPerHr": "Avg net /hr", "earn.takeHome": "take-home", "earn.add": "Add entry", "nav.earn": "Earn", "earn.tips": "Tips (₹)", "earn.trips": "Trips", "earn.perTrip": "/trip", "heat.emergency": "Emergency services", "heat.ambulance": "Ambulance", "heat.police": "Police", "heat.fire": "Fire", "heat.women": "Women safety", "heat.roadHelp": "Road accident", "heat.callNow": "Tap to call · free 24×7", "schemes.title": "Govt schemes", "schemes.sub": "Benefits you're entitled to as a gig worker", "schemes.entryTitle": "Govt schemes for you", "schemes.entrySub": "Pension, insurance & worker ID — free to join", "schemes.who": "Who can apply", "schemes.cost": "Cost", "schemes.how": "How to apply", "schemes.gives": "What you get", "schemes.apply": "Official website", "schemes.disclaimer": "Details may change — always confirm on the official website before applying.", "amen.all": "All", "amen.water": "Water", "amen.toilet": "Toilet", "amen.food": "Food", "amen.rest": "Rest/Shade", "amen.ev": "EV charge", "amen.parking": "Parking", "heat.amenities": "Rider amenities", "heat.addSpot": "+ Add a spot here", "amen.namePh": "Name (e.g. petrol pump, market)", "amen.addBtn": "Add", "amen.none": "None mapped within 5 km yet — add one below.", "voice.listen": "Speak", "voice.listening": "Listening…", "voice.play": "Play",
} as const;

type Key = keyof typeof en;

const hi: Record<Key, string> = {
  "nav.home": "होम", "nav.shifts": "शिफ्ट", "nav.heat": "गर्मी", "nav.rights": "हक़", "nav.profile": "प्रोफ़ाइल",

  "home.goodMorning": "सुप्रभात,", "home.goodAfternoon": "नमस्ते,", "home.goodEvening": "शुभ संध्या,",
  "home.viewPlan": "आज का प्लान देखें",
  "home.kicker": "गिग वर्कर · दिल्ली NCR",
  "home.heroTitle1": "स्मार्ट चलाओ।", "home.heroTitle2": "ज़्यादा कमाओ।",
  "home.heroSub": "स्मार्ट शिफ्ट प्लान — गर्मी से बचें, अपने हक़ जानें।",
  "home.cta": "अपना personalised प्लान पाएँ",
  "home.features": "फ़ीचर",
  "home.f.shift": "शिफ्ट प्लानर", "home.f.shiftDesc": "आज चलाने की सबसे अच्छी विंडो", "home.f.shiftTag": "लाइव",
  "home.f.heat": "गर्मी सुरक्षा", "home.f.heatDesc": "AQI · थकान का समय · पानी के पॉइंट", "home.f.heatTag": "आज तेज़",
  "home.f.rights": "अपने हक़ जानें", "home.f.rightsDesc": "आपकी भाषा में कानूनी मदद", "home.f.rightsTag": "5 विषय",
  "home.tip": "लाइव डिमांड व मौसम से अपडेटेड · दिल्ली NCR",
  "common.rider": "राइडर", "common.ncr": "दिल्ली NCR",

  "shifts.title": "शिफ्ट प्लानर",
  "loc.locating": "ढूँढ रहे हैं…", "loc.located": "मिल गया", "loc.ncr": "दिल्ली NCR",
  "loc.promptTitle": "लोकेशन चालू करें", "loc.promptSub": "अपने पास के इलाके व असली जगहें पाएँ — इसके बिना प्लान सामान्य रहता है।", "loc.enable": "चालू करें",
  "shifts.top3": "आज की टॉप 3 विंडो", "shifts.projected": "अनुमानित",
  "shifts.workWindow": "काम का समय", "shifts.hrs": "घंटे", "shifts.vsUsual": "आम दिन से",
  "shifts.showingSurge": "सर्ज डेटा दिखा रहे हैं —",
  "shifts.liveSpots": "आपके पास लाइव जगहें", "shifts.liveSpotsSub": "OpenStreetMap से असली नज़दीकी जगहें · दिशा के लिए टैप करें",
  "shifts.trafficNow": "अभी ट्रैफ़िक", "traffic.light": "हल्का", "traffic.moderate": "मध्यम", "traffic.heavy": "भारी",
  "shifts.trafficHeavyTip": "आपके पास भारी ट्रैफ़िक — छोटी ट्रिप चुनें और वेटिंग टाइम का चार्ज लें।",
  "shifts.allWindows": "आज की सभी विंडो",
  "shifts.ride": "राइड", "shifts.avoid": "टालें",
  "shifts.earningsOutlook": "कमाई का अनुमान", "shifts.earningsProjection": "कमाई प्रोजेक्शन",
  "shifts.eightWeeks": "RideKamao के साथ 8 हफ़्ते", "shifts.nowWeek": "अभी / हफ़्ता", "shifts.week8": "हफ़्ता 8",
  "shifts.perHour": "प्रति घंटा", "shifts.whereWhy": "कहाँ रहें और क्यों",
  "shifts.now": "अभी", "shifts.avoidBadge": "टालें", "shifts.rightNow": "अभी चल रहा",
  "d.whereToBe": "कहाँ रहें", "d.bestSpots": "अभी सबसे अच्छी जगहें",
  "d.whyGood": "अभी क्यों अच्छा है", "d.traffic": "ट्रैफ़िक",
  "d.cityZones": "जाने लायक व्यस्त इलाके", "d.busyZone": "व्यस्त इलाका · मैप के लिए टैप करें",
  "fb.q": "अभी भीड़?", "fb.yes": "भीड़ है", "fb.no": "खाली है", "fb.thanks": "धन्यवाद!", "fb.usuallyBusy": "राइडर: भीड़ रहती है", "fb.oftenQuiet": "राइडर: अक्सर खाली", "fb.mixed": "मिले-जुले",
  "d.areasNear": "आपके पास के इलाके (5 किमी में)", "shifts.heatMidday": "दोपहर 12–3:30 तेज़ गर्मी — हर 20 मिनट में पानी पिएँ, छाँव में आराम करें, हल्के कपड़े पहनें।", "d.lookFor": "अभी किसके पास रुकें",
  "d.peak": "सबसे ज़्यादा", "d.high": "ज़्यादा", "d.good": "अच्छा",

  "heat.title": "गर्मी सुरक्षा", "heat.updated": "अपडेटेड", "heat.refreshes": "हर घंटे रिफ्रेश · दिल्ली NCR",
  "heat.indexNcr": "हीट सेफ्टी इंडेक्स · दिल्ली NCR", "heat.takeBreaks": "नियमित ब्रेक लें और पानी पिएँ",
  "heat.feelsLike": "महसूस होता है", "heat.rightNow": "अभी", "heat.planBreaks": "अपने ब्रेक प्लान करें",
  "heat.fatigue": "थकान का अनुमानित समय", "heat.fatigueSub": "जब शरीर पर गर्मी का सबसे ज़्यादा असर हो",
  "heat.safe": "सुरक्षित", "heat.caution": "सावधान", "heat.high": "ज़्यादा", "heat.extreme": "बहुत ज़्यादा",
  "heat.sattu": "मुफ़्त पानी पॉइंट", "heat.nearby": "पास में", "heat.mapLive": "मैप · लाइव",
  "heat.tapPin": "देखें क्या मिल रहा है — पिन दबाएँ", "heat.you": "आप", "heat.directions": "रास्ता", "heat.openNow": "अभी खुला",
  "heat.beat": "आज गर्मी को मात दें",
  "heat.beatBody": "हर 30 मिनट में 1 गिलास पानी · ORS रखें · छाँव में पार्क करें · हल्के सूती कपड़े। 12–3:30 बजे की विंडो टालें।",
  "heat.avoidBanner": "आज 12:00 – 3:30 बजे चलाने से बचें। हीट इंडेक्स: 46°C",
  "heat.m.aqi": "AQI", "heat.m.temp": "तापमान", "heat.m.hum": "नमी", "heat.m.uv": "UV इंडेक्स",

  "ob.tagline": "राइड करो · कमाओ · आगे बढ़ो",
  "ob.heroTitle": "स्मार्ट चलाओ,\nज़्यादा कमाओ।",
  "ob.chooseLang": "अपनी भाषा चुनें · Language",
  "ob.getStarted": "शुरू करें",
  "ob.continue": "आगे बढ़ें", "ob.buildPlan": "मेरा प्लान बनाएँ",
  "ob.step": "स्टेप", "ob.of3": "/3",
  "ob.s1.title": "आप क्या चलाते हैं?", "ob.s1.sub": "हम हर सुझाव आपकी कमाई के हिसाब से बनाते हैं।",
  "ob.s2.title": "सबसे ज़रूरी क्या है?", "ob.s2.sub": "जो भी सही लगे चुनें — आपका प्लान इन्हीं पर बनेगा।",
  "ob.s3.title": "आपकी जानकारी", "ob.s3.sub": "आपका रोज़ का प्लान और कमाई रिपोर्ट — हर सुबह आपके इनबॉक्स में।",
  "ob.name": "आपका नाम", "ob.namePh": "जैसे रमेश कुमार", "ob.email": "ईमेल", "ob.emailPh": "you@email.com",
  "ob.weeklyTarget": "हफ़्ते का कमाई target",
  "ob.building": "आपका प्लान बन रहा है…", "ob.fewSeconds": "बस कुछ सेकंड",
  "ob.gen1": "आज का दिल्ली NCR मौसम व AQI पढ़ रहे हैं", "ob.gen2": "लोकल इवेंट देख रहे हैं — वीकेंड व त्योहार",
  "ob.gen3": "आपके ज़ोन का सर्ज इतिहास मिला रहे हैं", "ob.gen4": "आपका personalised शिफ्ट प्लान बना रहे हैं",

  "pf.yours": "आपकी प्रोफ़ाइल", "pf.setup": "प्रोफ़ाइल सेट करें",
  "pf.profession": "पेशा", "pf.language": "भाषा", "pf.weeklyTarget": "हफ़्ते का target", "pf.goals": "लक्ष्य",
  "pf.change": "बदलें", "pf.editAll": "सभी सेटिंग बदलें", "pf.reset": "रीसेट करें",
  "pf.setupBlurb": "personalised शिफ्ट प्लान, लोकेशन-आधारित सर्ज अलर्ट और कमाई अनुमान पाने के लिए अपनी प्रोफ़ाइल सेट करें।",
  "pf.perWeek": "/ हफ़्ता",
  "pf.signedInGoogle": "Google से साइन इन है",
  "pf.signInGoogle": "Google से साइन इन करें",
  "pf.signOut": "साइन आउट",
  "home.share": "WhatsApp पर शेयर करें",
  "home.install": "ऐप इंस्टॉल करें",
  "home.installHint": "होम स्क्रीन पर जोड़ें · ऑफ़लाइन चले · कम डेटा",
  "common.estimated": "अनुमानित",
  "heat.live": "लाइव", "heat.sample": "नमूना डेटा",
  "heat.safety": "सुरक्षा", "heat.call112": "112 पर कॉल करें", "heat.nearestHospital": "नज़दीकी अस्पताल",
  "share.msg": "RideKamao — दिल्ली NCR राइडर्स के लिए स्मार्ट शिफ्ट प्लान। गर्मी से बचें, ज़्यादा कमाएँ, अपने हक़ जानें:",
  "ob.useGoogle": "Google से जारी रखें", "ob.usingGoogle": "आपका Google अकाउंट इस्तेमाल हो रहा है", "ob.orType": "या अपनी जानकारी भरें",
  "heat.waterPoint": "पीने का पानी", "heat.noWater": "5 किमी के अंदर कोई मैप किया पानी पॉइंट नहीं — नमूना पॉइंट दिखा रहे हैं।",
  "heat.addWater": "+ यहाँ पानी पॉइंट जोड़ें", "heat.addWaterPrompt": "इस पानी पॉइंट का नाम (जैसे पेट्रोल पंप, मंदिर, दुकान):", "heat.added": "जुड़ गया — धन्यवाद!",
  "earn.title": "कमाई", "earn.sub": "आपके फ़ोन पर निजी रहता है", "earn.today": "आज दर्ज करें", "earn.amount": "कमाई (₹)", "earn.hours": "काम के घंटे", "earn.save": "सेव करें", "earn.thisWeek": "इस हफ़्ते", "earn.target": "हफ़्ते का target", "earn.noEntries": "अभी कोई एंट्री नहीं — ऊपर अपना पहला दिन दर्ज करें।", "earn.perHr": "/घंटा", "earn.recent": "हाल के दिन", "earn.open": "कमाई दर्ज करें", "earn.expenses": "ख़र्च (₹)", "earn.expensesHint": "पेट्रोल · रिचार्ज · मरम्मत", "earn.net": "शुद्ध", "earn.gross": "कुल", "earn.costs": "ख़र्च", "earn.platform": "प्लेटफ़ॉर्म", "earn.other": "अन्य", "earn.edit": "बदलें", "earn.delete": "हटाएँ", "earn.update": "एंट्री अपडेट करें", "earn.cancel": "रद्द करें", "earn.deleteConfirm": "यह एंट्री हटाएँ?", "earn.netThisWeek": "इस हफ़्ते शुद्ध कमाई", "earn.byPlatform": "प्लेटफ़ॉर्म अनुसार", "earn.last7": "पिछले 7 दिन", "earn.bestDay": "सबसे अच्छा दिन", "earn.avgPerHr": "औसत शुद्ध /घंटा", "earn.takeHome": "हाथ में", "earn.add": "एंट्री जोड़ें", "nav.earn": "कमाई", "earn.tips": "टिप (₹)", "earn.trips": "ट्रिप", "earn.perTrip": "/ट्रिप", "heat.emergency": "आपातकालीन सेवाएँ", "heat.ambulance": "एम्बुलेंस", "heat.police": "पुलिस", "heat.fire": "दमकल", "heat.women": "महिला सुरक्षा", "heat.roadHelp": "सड़क दुर्घटना", "heat.callNow": "कॉल के लिए टैप करें · मुफ़्त 24×7", "schemes.title": "सरकारी योजनाएँ", "schemes.sub": "गिग वर्कर के तौर पर आपके हक़ की सुविधाएँ", "schemes.entryTitle": "आपके लिए सरकारी योजनाएँ", "schemes.entrySub": "पेंशन, बीमा और वर्कर ID — मुफ़्त में जुड़ें", "schemes.who": "कौन आवेदन कर सकता है", "schemes.cost": "ख़र्च", "schemes.how": "आवेदन कैसे करें", "schemes.gives": "क्या मिलता है", "schemes.apply": "आधिकारिक वेबसाइट", "schemes.disclaimer": "जानकारी बदल सकती है — आवेदन से पहले आधिकारिक वेबसाइट पर पुष्टि करें।", "amen.all": "सभी", "amen.water": "पानी", "amen.toilet": "शौचालय", "amen.food": "खाना", "amen.rest": "आराम/छाँव", "amen.ev": "EV चार्ज", "amen.parking": "पार्किंग", "heat.amenities": "राइडर सुविधाएँ", "heat.addSpot": "+ यहाँ जगह जोड़ें", "amen.namePh": "नाम (जैसे पेट्रोल पंप, बाज़ार)", "amen.addBtn": "जोड़ें", "amen.none": "5 किमी में अभी कोई नहीं — नीचे जोड़ें।", "voice.listen": "बोलें", "voice.listening": "सुन रहे हैं…", "voice.play": "सुनें",
};

// Punjabi (Gurmukhi)
const pa: Partial<Record<Key, string>> = {
  "nav.home": "ਹੋਮ", "nav.shifts": "ਸ਼ਿਫ਼ਟ", "nav.heat": "ਗਰਮੀ", "nav.rights": "ਹੱਕ", "nav.profile": "ਪ੍ਰੋਫ਼ਾਈਲ",
  "home.goodMorning": "ਸ਼ੁਭ ਸਵੇਰ,", "home.goodAfternoon": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ,", "home.goodEvening": "ਸ਼ੁਭ ਸ਼ਾਮ,",
  "home.viewPlan": "ਅੱਜ ਦਾ ਪਲਾਨ ਵੇਖੋ",
  "home.kicker": "ਗਿਗ ਵਰਕਰ · ਦਿੱਲੀ NCR",
  "home.heroTitle1": "ਸਮਾਰਟ ਚਲਾਓ।", "home.heroTitle2": "ਵੱਧ ਕਮਾਓ।",
  "home.heroSub": "ਸਮਾਰਟ ਸ਼ਿਫ਼ਟ ਪਲਾਨ — ਗਰਮੀ ਤੋਂ ਬਚੋ, ਆਪਣੇ ਹੱਕ ਜਾਣੋ।",
  "home.cta": "ਆਪਣਾ personalised ਪਲਾਨ ਲਵੋ",
  "home.features": "ਫ਼ੀਚਰ",
  "home.f.shift": "ਸ਼ਿਫ਼ਟ ਪਲਾਨਰ", "home.f.shiftDesc": "ਅੱਜ ਚਲਾਉਣ ਦੀਆਂ ਵਧੀਆ ਵਿੰਡੋਜ਼", "home.f.shiftTag": "ਲਾਈਵ",
  "home.f.heat": "ਗਰਮੀ ਸੁਰੱਖਿਆ", "home.f.heatDesc": "AQI · ਥਕਾਵਟ ਸਮਾਂ · ਪਾਣੀ ਪੁਆਇੰਟ", "home.f.heatTag": "ਅੱਜ ਤੇਜ਼",
  "home.f.rights": "ਆਪਣੇ ਹੱਕ ਜਾਣੋ", "home.f.rightsDesc": "ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ ਕਾਨੂੰਨੀ ਮਦਦ", "home.f.rightsTag": "5 ਵਿਸ਼ੇ",
  "home.tip": "ਲਾਈਵ ਡਿਮਾਂਡ ਤੇ ਮੌਸਮ ਨਾਲ ਅੱਪਡੇਟ · ਦਿੱਲੀ NCR",
  "common.rider": "ਰਾਈਡਰ", "common.ncr": "ਦਿੱਲੀ NCR",
  "shifts.title": "ਸ਼ਿਫ਼ਟ ਪਲਾਨਰ",
  "loc.locating": "ਲੱਭ ਰਹੇ ਹਾਂ…", "loc.located": "ਮਿਲ ਗਿਆ", "loc.ncr": "ਦਿੱਲੀ NCR",
  "shifts.top3": "ਅੱਜ ਦੀਆਂ ਟਾਪ 3 ਵਿੰਡੋਜ਼", "shifts.projected": "ਅਨੁਮਾਨਿਤ",
  "shifts.workWindow": "ਕੰਮ ਦਾ ਸਮਾਂ", "shifts.hrs": "ਘੰਟੇ", "shifts.vsUsual": "ਆਮ ਦਿਨ ਤੋਂ",
  "shifts.showingSurge": "ਸਰਜ ਡੇਟਾ ਵਿਖਾ ਰਹੇ ਹਾਂ —",
  "shifts.liveSpots": "ਤੁਹਾਡੇ ਨੇੜੇ ਲਾਈਵ ਥਾਵਾਂ", "shifts.liveSpotsSub": "OpenStreetMap ਤੋਂ ਅਸਲੀ ਨੇੜਲੀਆਂ ਥਾਵਾਂ · ਦਿਸ਼ਾ ਲਈ ਟੈਪ ਕਰੋ",
  "shifts.allWindows": "ਅੱਜ ਦੀਆਂ ਸਾਰੀਆਂ ਵਿੰਡੋਜ਼",
  "shifts.ride": "ਰਾਈਡ", "shifts.avoid": "ਟਾਲੋ",
  "shifts.earningsOutlook": "ਕਮਾਈ ਦਾ ਅਨੁਮਾਨ", "shifts.earningsProjection": "ਕਮਾਈ ਪ੍ਰੋਜੈਕਸ਼ਨ",
  "shifts.eightWeeks": "RideKamao ਨਾਲ 8 ਹਫ਼ਤੇ", "shifts.nowWeek": "ਹੁਣ / ਹਫ਼ਤਾ", "shifts.week8": "ਹਫ਼ਤਾ 8",
  "shifts.perHour": "ਪ੍ਰਤੀ ਘੰਟਾ", "shifts.whereWhy": "ਕਿੱਥੇ ਰਹੋ ਤੇ ਕਿਉਂ",
  "shifts.now": "ਹੁਣ", "shifts.avoidBadge": "ਟਾਲੋ", "shifts.rightNow": "ਹੁਣੇ ਚੱਲ ਰਿਹਾ",
  "d.whereToBe": "ਕਿੱਥੇ ਰਹੋ", "d.bestSpots": "ਹੁਣ ਵਧੀਆ ਥਾਂਵਾਂ",
  "d.whyGood": "ਹੁਣ ਕਿਉਂ ਵਧੀਆ ਹੈ", "d.traffic": "ਟ੍ਰੈਫ਼ਿਕ",
  "d.cityZones": "ਜਾਣ ਯੋਗ ਵਿਅਸਤ ਇਲਾਕੇ", "d.busyZone": "ਵਿਅਸਤ ਇਲਾਕਾ · ਮੈਪ ਲਈ ਟੈਪ ਕਰੋ",
  "d.peak": "ਸਿਖਰ", "d.high": "ਵੱਧ", "d.good": "ਚੰਗਾ",
  "heat.title": "ਗਰਮੀ ਸੁਰੱਖਿਆ", "heat.updated": "ਅੱਪਡੇਟ", "heat.refreshes": "ਹਰ ਘੰਟੇ ਰਿਫ੍ਰੈਸ਼ · ਦਿੱਲੀ NCR",
  "heat.indexNcr": "ਹੀਟ ਸੇਫ਼ਟੀ ਇੰਡੈਕਸ · ਦਿੱਲੀ NCR", "heat.takeBreaks": "ਨਿਯਮਿਤ ਬ੍ਰੇਕ ਲਵੋ ਤੇ ਪਾਣੀ ਪੀਓ",
  "heat.feelsLike": "ਮਹਿਸੂਸ ਹੁੰਦਾ", "heat.rightNow": "ਹੁਣੇ", "heat.planBreaks": "ਆਪਣੇ ਬ੍ਰੇਕ ਪਲਾਨ ਕਰੋ",
  "heat.fatigue": "ਥਕਾਵਟ ਦਾ ਅਨੁਮਾਨਿਤ ਸਮਾਂ", "heat.fatigueSub": "ਜਦ ਸਰੀਰ 'ਤੇ ਗਰਮੀ ਦਾ ਸਭ ਤੋਂ ਵੱਧ ਅਸਰ ਹੋਵੇ",
  "heat.safe": "ਸੁਰੱਖਿਅਤ", "heat.caution": "ਸਾਵਧਾਨ", "heat.high": "ਵੱਧ", "heat.extreme": "ਬਹੁਤ ਵੱਧ",
  "heat.sattu": "ਮੁਫ਼ਤ ਪਾਣੀ ਪੁਆਇੰਟ", "heat.nearby": "ਨੇੜੇ", "heat.mapLive": "ਮੈਪ · ਲਾਈਵ",
  "heat.tapPin": "ਵੇਖਣ ਲਈ ਪਿੰਨ ਦਬਾਓ ਕਿ ਕੀ ਮਿਲ ਰਿਹਾ", "heat.you": "ਤੁਸੀਂ", "heat.directions": "ਰਸਤਾ", "heat.openNow": "ਹੁਣ ਖੁੱਲ੍ਹਾ",
  "heat.beat": "ਅੱਜ ਗਰਮੀ ਨੂੰ ਮਾਤ ਦਿਓ",
  "heat.beatBody": "ਹਰ 30 ਮਿੰਟ ਵਿੱਚ 1 ਗਿਲਾਸ ਪਾਣੀ · ORS ਰੱਖੋ · ਛਾਂ ਵਿੱਚ ਪਾਰਕ ਕਰੋ · ਹਲਕੇ ਸੂਤੀ ਕੱਪੜੇ। 12–3:30 ਵਜੇ ਦੀ ਵਿੰਡੋ ਟਾਲੋ।",
  "heat.avoidBanner": "ਅੱਜ 12:00 – 3:30 ਵਜੇ ਚਲਾਉਣ ਤੋਂ ਬਚੋ। ਹੀਟ ਇੰਡੈਕਸ: 46°C",
  "heat.m.aqi": "AQI", "heat.m.temp": "ਤਾਪਮਾਨ", "heat.m.hum": "ਨਮੀ", "heat.m.uv": "UV ਇੰਡੈਕਸ",
  "ob.tagline": "ਰਾਈਡ ਕਰੋ · ਕਮਾਓ · ਅੱਗੇ ਵਧੋ",
  "ob.heroTitle": "ਸਮਾਰਟ ਚਲਾਓ,\nਵੱਧ ਕਮਾਓ।",
  "ob.chooseLang": "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ · Language",
  "ob.getStarted": "ਸ਼ੁਰੂ ਕਰੋ", "ob.continue": "ਅੱਗੇ ਵਧੋ", "ob.buildPlan": "ਮੇਰਾ ਪਲਾਨ ਬਣਾਓ",
  "ob.step": "ਸਟੈਪ", "ob.of3": "/3",
  "ob.s1.title": "ਤੁਸੀਂ ਕੀ ਚਲਾਉਂਦੇ ਹੋ?", "ob.s1.sub": "ਅਸੀਂ ਹਰ ਸੁਝਾਅ ਤੁਹਾਡੀ ਕਮਾਈ ਮੁਤਾਬਕ ਬਣਾਉਂਦੇ ਹਾਂ।",
  "ob.s2.title": "ਸਭ ਤੋਂ ਜ਼ਰੂਰੀ ਕੀ ਹੈ?", "ob.s2.sub": "ਜੋ ਵੀ ਠੀਕ ਲੱਗੇ ਚੁਣੋ — ਤੁਹਾਡਾ ਪਲਾਨ ਇਨ੍ਹਾਂ 'ਤੇ ਬਣੇਗਾ।",
  "ob.s3.title": "ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ", "ob.s3.sub": "ਤੁਹਾਡਾ ਰੋਜ਼ਾਨਾ ਪਲਾਨ ਤੇ ਕਮਾਈ ਰਿਪੋਰਟ — ਹਰ ਸਵੇਰ ਤੁਹਾਡੇ ਇਨਬਾਕਸ ਵਿੱਚ।",
  "ob.name": "ਤੁਹਾਡਾ ਨਾਮ", "ob.namePh": "ਜਿਵੇਂ ਰਮੇਸ਼ ਕੁਮਾਰ", "ob.email": "ਈਮੇਲ", "ob.emailPh": "you@email.com",
  "ob.weeklyTarget": "ਹਫ਼ਤੇ ਦਾ ਕਮਾਈ target",
  "ob.building": "ਤੁਹਾਡਾ ਪਲਾਨ ਬਣ ਰਿਹਾ…", "ob.fewSeconds": "ਬਸ ਕੁਝ ਸਕਿੰਟ",
  "ob.gen1": "ਅੱਜ ਦਾ ਦਿੱਲੀ NCR ਮੌਸਮ ਤੇ AQI ਪੜ੍ਹ ਰਹੇ ਹਾਂ", "ob.gen2": "ਲੋਕਲ ਇਵੈਂਟ ਵੇਖ ਰਹੇ ਹਾਂ — ਵੀਕੈਂਡ ਤੇ ਤਿਉਹਾਰ",
  "ob.gen3": "ਤੁਹਾਡੇ ਜ਼ੋਨ ਦਾ ਸਰਜ ਇਤਿਹਾਸ ਮਿਲਾ ਰਹੇ ਹਾਂ", "ob.gen4": "ਤੁਹਾਡਾ personalised ਸ਼ਿਫ਼ਟ ਪਲਾਨ ਬਣਾ ਰਹੇ ਹਾਂ",
  "pf.yours": "ਤੁਹਾਡੀ ਪ੍ਰੋਫ਼ਾਈਲ", "pf.setup": "ਪ੍ਰੋਫ਼ਾਈਲ ਸੈੱਟ ਕਰੋ",
  "pf.profession": "ਪੇਸ਼ਾ", "pf.language": "ਭਾਸ਼ਾ", "pf.weeklyTarget": "ਹਫ਼ਤੇ ਦਾ target", "pf.goals": "ਟੀਚੇ",
  "pf.change": "ਬਦਲੋ", "pf.editAll": "ਸਾਰੀਆਂ ਸੈਟਿੰਗਾਂ ਬਦਲੋ", "pf.reset": "ਰੀਸੈੱਟ ਕਰੋ",
  "pf.setupBlurb": "personalised ਸ਼ਿਫ਼ਟ ਪਲਾਨ, ਲੋਕੇਸ਼ਨ-ਆਧਾਰਿਤ ਸਰਜ ਅਲਰਟ ਤੇ ਕਮਾਈ ਅਨੁਮਾਨ ਲਈ ਆਪਣੀ ਪ੍ਰੋਫ਼ਾਈਲ ਸੈੱਟ ਕਰੋ।",
  "pf.perWeek": "/ ਹਫ਼ਤਾ",
  "pf.signedInGoogle": "Google ਨਾਲ ਸਾਈਨ ਇਨ ਹੈ", "pf.signInGoogle": "Google ਨਾਲ ਸਾਈਨ ਇਨ ਕਰੋ", "pf.signOut": "ਸਾਈਨ ਆਊਟ",
  "home.share": "WhatsApp 'ਤੇ ਸਾਂਝਾ ਕਰੋ", "home.install": "ਐਪ ਇੰਸਟਾਲ ਕਰੋ",
  "home.installHint": "ਹੋਮ ਸਕ੍ਰੀਨ 'ਤੇ ਜੋੜੋ · ਆਫ਼ਲਾਈਨ ਚਲੇ · ਘੱਟ ਡੇਟਾ",
  "common.estimated": "ਅਨੁਮਾਨਿਤ",
  "heat.live": "ਲਾਈਵ", "heat.sample": "ਨਮੂਨਾ ਡੇਟਾ",
  "heat.safety": "ਸੁਰੱਖਿਆ", "heat.call112": "112 'ਤੇ ਕਾਲ ਕਰੋ", "heat.nearestHospital": "ਨੇੜਲਾ ਹਸਪਤਾਲ",
  "share.msg": "RideKamao — ਦਿੱਲੀ NCR ਰਾਈਡਰਾਂ ਲਈ ਸਮਾਰਟ ਸ਼ਿਫ਼ਟ ਪਲਾਨ। ਗਰਮੀ ਤੋਂ ਬਚੋ, ਵੱਧ ਕਮਾਓ, ਆਪਣੇ ਹੱਕ ਜਾਣੋ:",
  "ob.useGoogle": "Google ਨਾਲ ਜਾਰੀ ਰੱਖੋ", "ob.usingGoogle": "ਤੁਹਾਡਾ Google ਅਕਾਊਂਟ ਵਰਤਿਆ ਜਾ ਰਿਹਾ ਹੈ", "ob.orType": "ਜਾਂ ਆਪਣੀ ਜਾਣਕਾਰੀ ਭਰੋ",
  "heat.waterPoint": "ਪੀਣ ਵਾਲਾ ਪਾਣੀ", "heat.noWater": "5 ਕਿਮੀ ਦੇ ਅੰਦਰ ਕੋਈ ਮੈਪ ਕੀਤਾ ਪਾਣੀ ਪੁਆਇੰਟ ਨਹੀਂ — ਨਮੂਨਾ ਪੁਆਇੰਟ ਵਿਖਾ ਰਹੇ ਹਾਂ।",
  "heat.addWater": "+ ਇੱਥੇ ਪਾਣੀ ਪੁਆਇੰਟ ਜੋੜੋ", "heat.addWaterPrompt": "ਇਸ ਪਾਣੀ ਪੁਆਇੰਟ ਦਾ ਨਾਮ (ਜਿਵੇਂ ਪੈਟਰੋਲ ਪੰਪ, ਮੰਦਰ, ਦੁਕਾਨ):", "heat.added": "ਜੁੜ ਗਿਆ — ਧੰਨਵਾਦ!",
  "earn.title": "ਕਮਾਈ", "earn.sub": "ਤੁਹਾਡੇ ਫ਼ੋਨ 'ਤੇ ਨਿੱਜੀ ਰਹਿੰਦਾ ਹੈ", "earn.today": "ਅੱਜ ਦਰਜ ਕਰੋ", "earn.amount": "ਕਮਾਈ (₹)", "earn.hours": "ਕੰਮ ਦੇ ਘੰਟੇ", "earn.save": "ਸੇਵ ਕਰੋ", "earn.thisWeek": "ਇਸ ਹਫ਼ਤੇ", "earn.target": "ਹਫ਼ਤੇ ਦਾ target", "earn.noEntries": "ਹਾਲੇ ਕੋਈ ਐਂਟਰੀ ਨਹੀਂ — ਉੱਪਰ ਆਪਣਾ ਪਹਿਲਾ ਦਿਨ ਦਰਜ ਕਰੋ।", "earn.perHr": "/ਘੰਟਾ", "earn.recent": "ਹਾਲ ਦੇ ਦਿਨ", "earn.open": "ਕਮਾਈ ਦਰਜ ਕਰੋ", "earn.expenses": "ਖ਼ਰਚ (₹)", "earn.expensesHint": "ਪੈਟਰੋਲ · ਰੀਚਾਰਜ · ਮੁਰੰਮਤ", "earn.net": "ਸ਼ੁੱਧ", "earn.gross": "ਕੁੱਲ", "earn.costs": "ਖ਼ਰਚ", "earn.platform": "ਪਲੇਟਫਾਰਮ", "earn.other": "ਹੋਰ", "earn.edit": "ਬਦਲੋ", "earn.delete": "ਹਟਾਓ", "earn.update": "ਐਂਟਰੀ ਅੱਪਡੇਟ ਕਰੋ", "earn.cancel": "ਰੱਦ ਕਰੋ", "earn.deleteConfirm": "ਇਹ ਐਂਟਰੀ ਹਟਾਉਣੀ ਹੈ?", "earn.netThisWeek": "ਇਸ ਹਫ਼ਤੇ ਸ਼ੁੱਧ ਕਮਾਈ", "earn.byPlatform": "ਪਲੇਟਫਾਰਮ ਅਨੁਸਾਰ", "earn.last7": "ਪਿਛਲੇ 7 ਦਿਨ", "earn.bestDay": "ਸਭ ਤੋਂ ਵਧੀਆ ਦਿਨ", "earn.avgPerHr": "ਔਸਤ ਸ਼ੁੱਧ /ਘੰਟਾ", "earn.takeHome": "ਹੱਥ ਵਿੱਚ", "earn.add": "ਐਂਟਰੀ ਜੋੜੋ", "nav.earn": "ਕਮਾਈ", "earn.tips": "ਟਿਪ (₹)", "earn.trips": "ਟ੍ਰਿੱਪ", "earn.perTrip": "/ਟ੍ਰਿੱਪ", "heat.emergency": "ਐਮਰਜੈਂਸੀ ਸੇਵਾਵਾਂ", "heat.ambulance": "ਐਂਬੂਲੈਂਸ", "heat.police": "ਪੁਲਿਸ", "heat.fire": "ਫਾਇਰ ਬ੍ਰਿਗੇਡ", "heat.women": "ਮਹਿਲਾ ਸੁਰੱਖਿਆ", "heat.roadHelp": "ਸੜਕ ਹਾਦਸਾ", "heat.callNow": "ਕਾਲ ਲਈ ਟੈਪ ਕਰੋ · ਮੁਫ਼ਤ 24×7", "schemes.title": "ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ", "schemes.sub": "ਗਿਗ ਵਰਕਰ ਵਜੋਂ ਤੁਹਾਡੇ ਹੱਕ ਦੀਆਂ ਸਹੂਲਤਾਂ", "schemes.entryTitle": "ਤੁਹਾਡੇ ਲਈ ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ", "schemes.entrySub": "ਪੈਨਸ਼ਨ, ਬੀਮਾ ਤੇ ਵਰਕਰ ID — ਮੁਫ਼ਤ ਜੁੜੋ", "schemes.who": "ਕੌਣ ਅਰਜ਼ੀ ਦੇ ਸਕਦਾ ਹੈ", "schemes.cost": "ਖ਼ਰਚ", "schemes.how": "ਅਰਜ਼ੀ ਕਿਵੇਂ ਦੇਣੀ ਹੈ", "schemes.gives": "ਕੀ ਮਿਲਦਾ ਹੈ", "schemes.apply": "ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟ", "schemes.disclaimer": "ਜਾਣਕਾਰੀ ਬਦਲ ਸਕਦੀ ਹੈ — ਅਰਜ਼ੀ ਤੋਂ ਪਹਿਲਾਂ ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟ 'ਤੇ ਪੁਸ਼ਟੀ ਕਰੋ।", "amen.all": "ਸਭ", "amen.water": "ਪਾਣੀ", "amen.toilet": "ਪਖਾਨਾ", "amen.food": "ਖਾਣਾ", "amen.rest": "ਆਰਾਮ/ਛਾਂ", "amen.ev": "EV ਚਾਰਜ", "amen.parking": "ਪਾਰਕਿੰਗ", "heat.amenities": "ਰਾਈਡਰ ਸਹੂਲਤਾਂ", "heat.addSpot": "+ ਇੱਥੇ ਜਗ੍ਹਾ ਜੋੜੋ", "amen.namePh": "ਨਾਮ (ਜਿਵੇਂ ਪੈਟਰੋਲ ਪੰਪ, ਬਾਜ਼ਾਰ)", "amen.addBtn": "ਜੋੜੋ", "amen.none": "5 ਕਿਮੀ ਵਿੱਚ ਹਾਲੇ ਕੋਈ ਨਹੀਂ — ਹੇਠਾਂ ਜੋੜੋ।", "voice.listen": "ਬੋਲੋ", "voice.listening": "ਸੁਣ ਰਹੇ ਹਾਂ…", "voice.play": "ਸੁਣੋ",
};

// Bengali
const bn: Partial<Record<Key, string>> = {
  "nav.home": "হোম", "nav.shifts": "শিফট", "nav.heat": "গরম", "nav.rights": "অধিকার", "nav.profile": "প্রোফাইল",
  "home.goodMorning": "সুপ্রভাত,", "home.goodAfternoon": "নমস্কার,", "home.goodEvening": "শুভ সন্ধ্যা,",
  "home.viewPlan": "আজকের প্ল্যান দেখুন",
  "home.kicker": "গিগ কর্মী · দিল্লি NCR",
  "home.heroTitle1": "স্মার্ট চালান।", "home.heroTitle2": "বেশি আয় করুন।",
  "home.heroSub": "স্মার্ট শিফট প্ল্যান — গরম এড়ান, নিজের অধিকার জানুন।",
  "home.cta": "আপনার personalised প্ল্যান নিন",
  "home.features": "ফিচার",
  "home.f.shift": "শিফট প্ল্যানার", "home.f.shiftDesc": "আজ চালানোর সেরা সময়", "home.f.shiftTag": "লাইভ",
  "home.f.heat": "গরম সুরক্ষা", "home.f.heatDesc": "AQI · ক্লান্তির সময় · জলের পয়েন্ট", "home.f.heatTag": "আজ বেশি",
  "home.f.rights": "নিজের অধিকার জানুন", "home.f.rightsDesc": "আপনার ভাষায় আইনি সাহায্য", "home.f.rightsTag": "৫ বিষয়",
  "home.tip": "লাইভ ডিমান্ড ও আবহাওয়া সহ আপডেট · দিল্লি NCR",
  "common.rider": "রাইডার", "common.ncr": "দিল্লি NCR",
  "shifts.title": "শিফট প্ল্যানার",
  "loc.locating": "খুঁজছি…", "loc.located": "পাওয়া গেছে", "loc.ncr": "দিল্লি NCR",
  "shifts.top3": "আজকের সেরা ৩টি সময়", "shifts.projected": "আনুমানিক",
  "shifts.workWindow": "কাজের সময়", "shifts.hrs": "ঘণ্টা", "shifts.vsUsual": "সাধারণ দিনের তুলনায়",
  "shifts.showingSurge": "সার্জ ডেটা দেখাচ্ছি —",
  "shifts.liveSpots": "আপনার কাছে লাইভ স্পট", "shifts.liveSpotsSub": "OpenStreetMap থেকে আসল কাছের জায়গা · দিক নির্দেশের জন্য ট্যাপ করুন",
  "shifts.allWindows": "আজকের সব সময়",
  "shifts.ride": "রাইড", "shifts.avoid": "এড়ান",
  "shifts.earningsOutlook": "আয়ের পূর্বাভাস", "shifts.earningsProjection": "আয় প্রজেকশন",
  "shifts.eightWeeks": "RideKamao-র সাথে ৮ সপ্তাহ", "shifts.nowWeek": "এখন / সপ্তাহ", "shifts.week8": "সপ্তাহ ৮",
  "shifts.perHour": "প্রতি ঘণ্টা", "shifts.whereWhy": "কোথায় থাকবেন ও কেন",
  "shifts.now": "এখন", "shifts.avoidBadge": "এড়ান", "shifts.rightNow": "এখন চলছে",
  "d.whereToBe": "কোথায় থাকবেন", "d.bestSpots": "এখন সেরা জায়গা",
  "d.whyGood": "এখন কেন ভালো", "d.traffic": "ট্রাফিক",
  "d.cityZones": "যেখানে যাবেন এমন ব্যস্ত এলাকা", "d.busyZone": "ব্যস্ত এলাকা · ম্যাপের জন্য ট্যাপ করুন",
  "d.peak": "সর্বোচ্চ", "d.high": "বেশি", "d.good": "ভালো",
  "heat.title": "গরম সুরক্ষা", "heat.updated": "আপডেট", "heat.refreshes": "প্রতি ঘণ্টায় রিফ্রেশ · দিল্লি NCR",
  "heat.indexNcr": "হিট সেফটি ইনডেক্স · দিল্লি NCR", "heat.takeBreaks": "নিয়মিত বিরতি নিন ও জল খান",
  "heat.feelsLike": "অনুভূত হয়", "heat.rightNow": "এখন", "heat.planBreaks": "আপনার বিরতি পরিকল্পনা করুন",
  "heat.fatigue": "ক্লান্তির আনুমানিক সময়", "heat.fatigueSub": "যখন শরীরে গরমের প্রভাব সবচেয়ে বেশি",
  "heat.safe": "নিরাপদ", "heat.caution": "সতর্ক", "heat.high": "বেশি", "heat.extreme": "অত্যধিক",
  "heat.sattu": "বিনামূল্যে জলের পয়েন্ট", "heat.nearby": "কাছে", "heat.mapLive": "ম্যাপ · লাইভ",
  "heat.tapPin": "কী পাওয়া যাচ্ছে দেখতে পিন চাপুন", "heat.you": "আপনি", "heat.directions": "পথ", "heat.openNow": "এখন খোলা",
  "heat.beat": "আজ গরমকে হারান",
  "heat.beatBody": "প্রতি ৩০ মিনিটে ১ গ্লাস জল · ORS রাখুন · ছায়ায় পার্ক করুন · হালকা সুতির পোশাক। ১২–৩:৩০টার সময় এড়ান।",
  "heat.avoidBanner": "আজ ১২:০০ – ৩:৩০টায় চালানো এড়ান। হিট ইনডেক্স: 46°C",
  "heat.m.aqi": "AQI", "heat.m.temp": "তাপমাত্রা", "heat.m.hum": "আর্দ্রতা", "heat.m.uv": "UV ইনডেক্স",
  "ob.tagline": "রাইড করুন · আয় করুন · এগিয়ে যান",
  "ob.heroTitle": "স্মার্ট চালান,\nবেশি আয় করুন।",
  "ob.chooseLang": "আপনার ভাষা বাছুন · Language",
  "ob.getStarted": "শুরু করুন", "ob.continue": "এগিয়ে যান", "ob.buildPlan": "আমার প্ল্যান বানান",
  "ob.step": "ধাপ", "ob.of3": "/3",
  "ob.s1.title": "আপনি কী চালান?", "ob.s1.sub": "আমরা প্রতিটি পরামর্শ আপনার আয় অনুযায়ী তৈরি করি।",
  "ob.s2.title": "সবচেয়ে জরুরি কী?", "ob.s2.sub": "যা মানায় বাছুন — আপনার প্ল্যান এগুলোর উপর তৈরি হবে।",
  "ob.s3.title": "আপনার তথ্য", "ob.s3.sub": "আপনার প্রতিদিনের প্ল্যান ও আয় রিপোর্ট — প্রতি সকালে আপনার ইনবক্সে।",
  "ob.name": "আপনার নাম", "ob.namePh": "যেমন রমেশ কুমার", "ob.email": "ইমেল", "ob.emailPh": "you@email.com",
  "ob.weeklyTarget": "সাপ্তাহিক আয় target",
  "ob.building": "আপনার প্ল্যান তৈরি হচ্ছে…", "ob.fewSeconds": "মাত্র কয়েক সেকেন্ড",
  "ob.gen1": "আজকের দিল্লি NCR আবহাওয়া ও AQI পড়ছি", "ob.gen2": "লোকাল ইভেন্ট দেখছি — সপ্তাহান্ত ও উৎসব",
  "ob.gen3": "আপনার জোনের সার্জ ইতিহাস মেলাচ্ছি", "ob.gen4": "আপনার personalised শিফট প্ল্যান বানাচ্ছি",
  "pf.yours": "আপনার প্রোফাইল", "pf.setup": "প্রোফাইল সেট করুন",
  "pf.profession": "পেশা", "pf.language": "ভাষা", "pf.weeklyTarget": "সাপ্তাহিক target", "pf.goals": "লক্ষ্য",
  "pf.change": "বদলান", "pf.editAll": "সব সেটিং বদলান", "pf.reset": "রিসেট করুন",
  "pf.setupBlurb": "personalised শিফট প্ল্যান, লোকেশন-ভিত্তিক সার্জ অ্যালার্ট ও আয় পূর্বাভাস পেতে আপনার প্রোফাইল সেট করুন।",
  "pf.perWeek": "/ সপ্তাহ",
  "pf.signedInGoogle": "Google দিয়ে সাইন ইন আছে", "pf.signInGoogle": "Google দিয়ে সাইন ইন করুন", "pf.signOut": "সাইন আউট",
  "home.share": "WhatsApp-এ শেয়ার করুন", "home.install": "অ্যাপ ইনস্টল করুন",
  "home.installHint": "হোম স্ক্রিনে যোগ করুন · অফলাইন চলে · কম ডেটা",
  "common.estimated": "আনুমানিক",
  "heat.live": "লাইভ", "heat.sample": "নমুনা ডেটা",
  "heat.safety": "সুরক্ষা", "heat.call112": "112-এ কল করুন", "heat.nearestHospital": "নিকটতম হাসপাতাল",
  "share.msg": "RideKamao — দিল্লি NCR রাইডারদের জন্য স্মার্ট শিফট প্ল্যান। গরম এড়ান, বেশি আয় করুন, নিজের অধিকার জানুন:",
  "ob.useGoogle": "Google দিয়ে চালিয়ে যান", "ob.usingGoogle": "আপনার Google অ্যাকাউন্ট ব্যবহার করা হচ্ছে", "ob.orType": "অথবা আপনার তথ্য দিন",
  "heat.waterPoint": "পানীয় জল", "heat.noWater": "5 কিমির মধ্যে কোনো ম্যাপ করা জলের পয়েন্ট নেই — নমুনা পয়েন্ট দেখাচ্ছি।",
  "heat.addWater": "+ এখানে জলের পয়েন্ট যোগ করুন", "heat.addWaterPrompt": "এই জলের পয়েন্টের নাম দিন (যেমন পেট্রোল পাম্প, মন্দির, দোকান):", "heat.added": "যোগ হয়েছে — ধন্যবাদ!",
  "earn.title": "আয়", "earn.sub": "আপনার ফোনে ব্যক্তিগত থাকে", "earn.today": "আজ লিখুন", "earn.amount": "আয় (₹)", "earn.hours": "কাজের ঘণ্টা", "earn.save": "সেভ করুন", "earn.thisWeek": "এই সপ্তাহে", "earn.target": "সাপ্তাহিক target", "earn.noEntries": "এখনও কোনো এন্ট্রি নেই — উপরে আপনার প্রথম দিন লিখুন।", "earn.perHr": "/ঘণ্টা", "earn.recent": "সাম্প্রতিক দিন", "earn.open": "আয় লিখুন", "earn.expenses": "খরচ (₹)", "earn.expensesHint": "পেট্রোল · রিচার্জ · মেরামত", "earn.net": "নিট", "earn.gross": "মোট", "earn.costs": "খরচ", "earn.platform": "প্ল্যাটফর্ম", "earn.other": "অন্যান্য", "earn.edit": "এডিট", "earn.delete": "মুছুন", "earn.update": "এন্ট্রি আপডেট করুন", "earn.cancel": "বাতিল", "earn.deleteConfirm": "এই এন্ট্রি মুছবেন?", "earn.netThisWeek": "এই সপ্তাহে নিট আয়", "earn.byPlatform": "প্ল্যাটফর্ম অনুযায়ী", "earn.last7": "গত ৭ দিন", "earn.bestDay": "সেরা দিন", "earn.avgPerHr": "গড় নিট /ঘণ্টা", "earn.takeHome": "হাতে", "earn.add": "এন্ট্রি যোগ করুন", "nav.earn": "আয়", "earn.tips": "টিপস (₹)", "earn.trips": "ট্রিপ", "earn.perTrip": "/ট্রিপ", "heat.emergency": "জরুরি পরিষেবা", "heat.ambulance": "অ্যাম্বুলেন্স", "heat.police": "পুলিশ", "heat.fire": "দমকল", "heat.women": "নারী নিরাপত্তা", "heat.roadHelp": "সড়ক দুর্ঘটনা", "heat.callNow": "কল করতে ট্যাপ করুন · ফ্রি 24×7", "schemes.title": "সরকারি প্রকল্প", "schemes.sub": "গিগ কর্মী হিসেবে আপনার প্রাপ্য সুবিধা", "schemes.entryTitle": "আপনার জন্য সরকারি প্রকল্প", "schemes.entrySub": "পেনশন, বিমা ও কর্মী ID — বিনামূল্যে যোগ দিন", "schemes.who": "কে আবেদন করতে পারেন", "schemes.cost": "খরচ", "schemes.how": "কীভাবে আবেদন করবেন", "schemes.gives": "কী পাবেন", "schemes.apply": "অফিসিয়াল ওয়েবসাইট", "schemes.disclaimer": "তথ্য পরিবর্তন হতে পারে — আবেদনের আগে অফিসিয়াল ওয়েবসাইটে নিশ্চিত করুন।", "amen.all": "সব", "amen.water": "জল", "amen.toilet": "শৌচালয়", "amen.food": "খাবার", "amen.rest": "বিশ্রাম/ছায়া", "amen.ev": "EV চার্জ", "amen.parking": "পার্কিং", "heat.amenities": "রাইডার সুবিধা", "heat.addSpot": "+ এখানে জায়গা যোগ করুন", "amen.namePh": "নাম (যেমন পেট্রোল পাম্প, বাজার)", "amen.addBtn": "যোগ করুন", "amen.none": "5 কিমির মধ্যে এখনও কিছু নেই — নিচে যোগ করুন।", "voice.listen": "বলুন", "voice.listening": "শুনছি…", "voice.play": "শুনুন",
};

// Tamil
const ta: Partial<Record<Key, string>> = {
  "nav.home": "முகப்பு", "nav.shifts": "ஷிஃப்ட்", "nav.heat": "வெப்பம்", "nav.rights": "உரிமை", "nav.profile": "சுயவிவரம்",
  "home.goodMorning": "காலை வணக்கம்,", "home.goodAfternoon": "வணக்கம்,", "home.goodEvening": "மாலை வணக்கம்,",
  "home.viewPlan": "இன்றைய திட்டத்தைப் பார்க்க",
  "home.kicker": "கிக் தொழிலாளர் · டெல்லி NCR",
  "home.heroTitle1": "ஸ்மார்ட்டாக ஓட்டு.", "home.heroTitle2": "அதிகம் சம்பாதி.",
  "home.heroSub": "ஸ்மார்ட் ஷிஃப்ட் திட்டம் — வெப்பத்தை வெல், உரிமைகளை அறி.",
  "home.cta": "உங்கள் personalised திட்டத்தைப் பெறுங்கள்",
  "home.features": "அம்சங்கள்",
  "home.f.shift": "ஷிஃப்ட் பிளானர்", "home.f.shiftDesc": "இன்று ஓட்ட சிறந்த நேரங்கள்", "home.f.shiftTag": "நேரலை",
  "home.f.heat": "வெப்ப பாதுகாப்பு", "home.f.heatDesc": "AQI · சோர்வு நேரம் · தண்ணீர் இடங்கள்", "home.f.heatTag": "இன்று அதிகம்",
  "home.f.rights": "உங்கள் உரிமைகளை அறி", "home.f.rightsDesc": "உங்கள் மொழியில் சட்ட உதவி", "home.f.rightsTag": "5 தலைப்புகள்",
  "home.tip": "நேரலை டிமாண்ட் & வானிலையுடன் புதுப்பிப்பு · டெல்லி NCR",
  "common.rider": "ரைடர்", "common.ncr": "டெல்லி NCR",
  "shifts.title": "ஷிஃப்ட் பிளானர்",
  "loc.locating": "தேடுகிறோம்…", "loc.located": "கண்டறியப்பட்டது", "loc.ncr": "டெல்லி NCR",
  "shifts.top3": "இன்றைய சிறந்த 3 நேரங்கள்", "shifts.projected": "மதிப்பிடப்பட்டது",
  "shifts.workWindow": "வேலை நேரம்", "shifts.hrs": "மணி", "shifts.vsUsual": "வழக்கத்தை விட",
  "shifts.showingSurge": "சர்ஜ் தரவைக் காட்டுகிறோம் —",
  "shifts.liveSpots": "உங்கள் அருகில் நேரலை இடங்கள்", "shifts.liveSpotsSub": "OpenStreetMap-இலிருந்து உண்மையான அருகிலுள்ள இடங்கள் · திசைக்கு தட்டவும்",
  "shifts.allWindows": "இன்றைய எல்லா நேரங்களும்",
  "shifts.ride": "ரைடு", "shifts.avoid": "தவிர்",
  "shifts.earningsOutlook": "வருமான மதிப்பீடு", "shifts.earningsProjection": "வருமான முன்னறிவிப்பு",
  "shifts.eightWeeks": "RideKamao உடன் 8 வாரங்கள்", "shifts.nowWeek": "இப்போது / வாரம்", "shifts.week8": "வாரம் 8",
  "shifts.perHour": "ஒரு மணிக்கு", "shifts.whereWhy": "எங்கே இருக்க வேண்டும் & ஏன்",
  "shifts.now": "இப்போது", "shifts.avoidBadge": "தவிர்", "shifts.rightNow": "இப்போது நடக்கிறது",
  "d.whereToBe": "எங்கே இருக்க வேண்டும்", "d.bestSpots": "இப்போது சிறந்த இடங்கள்",
  "d.whyGood": "இப்போது ஏன் நல்லது", "d.traffic": "போக்குவரத்து",
  "d.cityZones": "செல்ல வேண்டிய பரபரப்பான பகுதிகள்", "d.busyZone": "பரபரப்பான பகுதி · வரைபடத்திற்கு தட்டவும்",
  "d.peak": "உச்சம்", "d.high": "அதிகம்", "d.good": "நல்லது",
  "heat.title": "வெப்ப பாதுகாப்பு", "heat.updated": "புதுப்பிப்பு", "heat.refreshes": "ஒவ்வொரு மணியும் புதுப்பிப்பு · டெல்லி NCR",
  "heat.indexNcr": "வெப்ப பாதுகாப்பு குறியீடு · டெல்லி NCR", "heat.takeBreaks": "தவறாமல் இடைவெளி எடுத்து தண்ணீர் குடியுங்கள்",
  "heat.feelsLike": "உணரப்படுகிறது", "heat.rightNow": "இப்போது", "heat.planBreaks": "உங்கள் இடைவெளிகளைத் திட்டமிடுங்கள்",
  "heat.fatigue": "சோர்வு மதிப்பிட்ட நேரம்", "heat.fatigueSub": "உடலில் வெப்ப அழுத்தம் உச்சத்தில் இருக்கும் போது",
  "heat.safe": "பாதுகாப்பு", "heat.caution": "எச்சரிக்கை", "heat.high": "அதிகம்", "heat.extreme": "மிக அதிகம்",
  "heat.sattu": "இலவச தண்ணீர் இடங்கள்", "heat.nearby": "அருகில்", "heat.mapLive": "வரைபடம் · நேரலை",
  "heat.tapPin": "என்ன கிடைக்கிறது என்று பார்க்க பின்னை தட்டவும்", "heat.you": "நீங்கள்", "heat.directions": "வழி", "heat.openNow": "இப்போது திறந்துள்ளது",
  "heat.beat": "இன்று வெப்பத்தை வெல்லுங்கள்",
  "heat.beatBody": "ஒவ்வொரு 30 நிமிடத்திற்கும் 1 கிளாஸ் தண்ணீர் · ORS வைத்திருங்கள் · நிழலில் நிறுத்துங்கள் · இலகுவான பருத்தி ஆடை. 12–3:30 நேரத்தைத் தவிருங்கள்.",
  "heat.avoidBanner": "இன்று 12:00 – 3:30 மணி ஓட்டுவதைத் தவிருங்கள். வெப்பக் குறியீடு: 46°C",
  "heat.m.aqi": "AQI", "heat.m.temp": "வெப்பநிலை", "heat.m.hum": "ஈரப்பதம்", "heat.m.uv": "UV குறியீடு",
  "ob.tagline": "ரைடு செய் · சம்பாதி · முன்னேறு",
  "ob.heroTitle": "ஸ்மார்ட்டாக ஓட்டு,\nஅதிகம் சம்பாதி.",
  "ob.chooseLang": "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும் · Language",
  "ob.getStarted": "தொடங்கு", "ob.continue": "தொடரவும்", "ob.buildPlan": "என் திட்டத்தை உருவாக்கு",
  "ob.step": "படி", "ob.of3": "/3",
  "ob.s1.title": "நீங்கள் எதை ஓட்டுகிறீர்கள்?", "ob.s1.sub": "ஒவ்வொரு பரிந்துரையையும் உங்கள் வருமானத்திற்கேற்ப அமைக்கிறோம்.",
  "ob.s2.title": "எது மிக முக்கியம்?", "ob.s2.sub": "பொருந்துவதைத் தேர்ந்தெடுக்கவும் — உங்கள் திட்டம் இவற்றின் அடிப்படையில் அமையும்.",
  "ob.s3.title": "உங்கள் விவரங்கள்", "ob.s3.sub": "உங்கள் தினசரி திட்டமும் வருமான அறிக்கையும் — ஒவ்வொரு காலையும் உங்கள் இன்பாக்ஸில்.",
  "ob.name": "உங்கள் பெயர்", "ob.namePh": "எ.கா. ரமேஷ் குமார்", "ob.email": "மின்னஞ்சல்", "ob.emailPh": "you@email.com",
  "ob.weeklyTarget": "வாராந்திர வருமான target",
  "ob.building": "உங்கள் திட்டம் உருவாகிறது…", "ob.fewSeconds": "சில விநாடிகள் மட்டுமே",
  "ob.gen1": "இன்றைய டெல்லி NCR வானிலை & AQI படிக்கிறோம்", "ob.gen2": "உள்ளூர் நிகழ்வுகளைப் பார்க்கிறோம் — வார இறுதி & பண்டிகைகள்",
  "ob.gen3": "உங்கள் மண்டலத்தின் சர்ஜ் வரலாற்றைப் பொருத்துகிறோம்", "ob.gen4": "உங்கள் personalised ஷிஃப்ட் திட்டத்தை உருவாக்குகிறோம்",
  "pf.yours": "உங்கள் சுயவிவரம்", "pf.setup": "சுயவிவரத்தை அமை",
  "pf.profession": "தொழில்", "pf.language": "மொழி", "pf.weeklyTarget": "வாராந்திர target", "pf.goals": "இலக்குகள்",
  "pf.change": "மாற்று", "pf.editAll": "எல்லா அமைப்புகளையும் மாற்று", "pf.reset": "மீட்டமை",
  "pf.setupBlurb": "personalised ஷிஃப்ட் திட்டம், இடம் சார்ந்த சர்ஜ் எச்சரிக்கைகள் மற்றும் வருமான மதிப்பீடுகளைப் பெற உங்கள் சுயவிவரத்தை அமைக்கவும்.",
  "pf.perWeek": "/ வாரம்",
  "pf.signedInGoogle": "Google மூலம் உள்நுழைந்துள்ளீர்கள்", "pf.signInGoogle": "Google மூலம் உள்நுழைக", "pf.signOut": "வெளியேறு",
  "home.share": "WhatsApp-ல் பகிர்", "home.install": "ஆப்பை நிறுவு",
  "home.installHint": "முகப்புத் திரையில் சேர் · ஆஃப்லைனில் இயங்கும் · குறைந்த டேட்டா",
  "common.estimated": "மதிப்பிடப்பட்டது",
  "heat.live": "நேரலை", "heat.sample": "மாதிரி தரவு",
  "heat.safety": "பாதுகாப்பு", "heat.call112": "112-ஐ அழை", "heat.nearestHospital": "அருகில் உள்ள மருத்துவமனை",
  "share.msg": "RideKamao — டெல்லி NCR ரைடர்களுக்கான ஸ்மார்ட் ஷிஃப்ட் திட்டம். வெப்பத்தை வெல், அதிகம் சம்பாதி, உரிமைகளை அறி:",
  "ob.useGoogle": "Google மூலம் தொடரவும்", "ob.usingGoogle": "உங்கள் Google கணக்கு பயன்படுத்தப்படுகிறது", "ob.orType": "அல்லது உங்கள் விவரங்களை உள்ளிடவும்",
  "heat.waterPoint": "குடிநீர்", "heat.noWater": "5 கிமீ-க்குள் வரைபடமிட்ட நீர் இடம் இல்லை — மாதிரி இடங்களைக் காட்டுகிறோம்.",
  "heat.addWater": "+ இங்கே நீர் இடத்தைச் சேர்க்கவும்", "heat.addWaterPrompt": "இந்த நீர் இடத்திற்குப் பெயரிடுங்கள் (எ.கா. பெட்ரோல் பங்க், கோயில், கடை):", "heat.added": "சேர்க்கப்பட்டது — நன்றி!",
  "earn.title": "வருமானம்", "earn.sub": "உங்கள் ஃபோனில் தனிப்பட்டதாக இருக்கும்", "earn.today": "இன்று பதிவு செய்", "earn.amount": "வருமானம் (₹)", "earn.hours": "வேலை செய்த மணிநேரம்", "earn.save": "சேமி", "earn.thisWeek": "இந்த வாரம்", "earn.target": "வாராந்திர target", "earn.noEntries": "இன்னும் பதிவுகள் இல்லை — மேலே உங்கள் முதல் நாளைப் பதிவு செய்யுங்கள்.", "earn.perHr": "/மணி", "earn.recent": "சமீபத்திய நாட்கள்", "earn.open": "வருமானத்தைப் பதிவு செய்", "earn.expenses": "செலவு (₹)", "earn.expensesHint": "பெட்ரோல் · ரீசார்ஜ் · பழுது", "earn.net": "நிகர", "earn.gross": "மொத்தம்", "earn.costs": "செலவு", "earn.platform": "தளம்", "earn.other": "மற்றவை", "earn.edit": "திருத்து", "earn.delete": "நீக்கு", "earn.update": "பதிவைப் புதுப்பி", "earn.cancel": "ரத்து", "earn.deleteConfirm": "இந்தப் பதிவை நீக்கவா?", "earn.netThisWeek": "இந்த வாரம் நிகர வருமானம்", "earn.byPlatform": "தளம் வாரியாக", "earn.last7": "கடந்த 7 நாட்கள்", "earn.bestDay": "சிறந்த நாள்", "earn.avgPerHr": "சராசரி நிகர /மணி", "earn.takeHome": "கையில்", "earn.add": "பதிவைச் சேர்", "nav.earn": "வரவு", "earn.tips": "டிப்ஸ் (₹)", "earn.trips": "டிரிப்", "earn.perTrip": "/டிரிப்", "heat.emergency": "அவசர சேவைகள்", "heat.ambulance": "ஆம்புலன்ஸ்", "heat.police": "காவல்", "heat.fire": "தீயணைப்பு", "heat.women": "பெண்கள் பாதுகாப்பு", "heat.roadHelp": "சாலை விபத்து", "heat.callNow": "அழைக்க தட்டவும் · இலவசம் 24×7", "schemes.title": "அரசு திட்டங்கள்", "schemes.sub": "கிக் தொழிலாளராக உங்களுக்கு உரிய சலுகைகள்", "schemes.entryTitle": "உங்களுக்கான அரசு திட்டங்கள்", "schemes.entrySub": "ஓய்வூதியம், காப்பீடு & தொழிலாளர் ID — இலவசமாக சேரவும்", "schemes.who": "யார் விண்ணப்பிக்கலாம்", "schemes.cost": "செலவு", "schemes.how": "எப்படி விண்ணப்பிப்பது", "schemes.gives": "என்ன கிடைக்கும்", "schemes.apply": "அதிகாரப்பூர்வ இணையதளம்", "schemes.disclaimer": "தகவல் மாறலாம் — விண்ணப்பிக்கும் முன் அதிகாரப்பூர்வ இணையதளத்தில் உறுதிப்படுத்தவும்.", "amen.all": "அனைத்தும்", "amen.water": "தண்ணீர்", "amen.toilet": "கழிப்பறை", "amen.food": "உணவு", "amen.rest": "ஓய்வு/நிழல்", "amen.ev": "EV சார்ஜ்", "amen.parking": "பார்க்கிங்", "heat.amenities": "ரைடர் வசதிகள்", "heat.addSpot": "+ இங்கே இடம் சேர்க்க", "amen.namePh": "பெயர் (எ.கா. பெட்ரோல் பங்க், சந்தை)", "amen.addBtn": "சேர்", "amen.none": "5 கி.மீ.க்குள் இன்னும் எதுவும் இல்லை — கீழே சேர்க்கவும்.", "voice.listen": "பேசு", "voice.listening": "கேட்கிறோம்…", "voice.play": "கேள்",
};

// Marathi
const mr: Partial<Record<Key, string>> = {
  "nav.home": "होम", "nav.shifts": "शिफ्ट", "nav.heat": "उष्णता", "nav.rights": "हक्क", "nav.profile": "प्रोफाइल",
  "home.goodMorning": "सुप्रभात,", "home.goodAfternoon": "नमस्कार,", "home.goodEvening": "शुभ संध्याकाळ,",
  "home.viewPlan": "आजचा प्लॅन पाहा",
  "home.kicker": "गिग कामगार · दिल्ली NCR",
  "home.heroTitle1": "स्मार्ट चालवा.", "home.heroTitle2": "जास्त कमवा.",
  "home.heroSub": "स्मार्ट शिफ्ट प्लॅन — उष्णता टाळा, तुमचे हक्क जाणा.",
  "home.cta": "तुमचा personalised प्लॅन मिळवा",
  "home.features": "वैशिष्ट्ये",
  "home.f.shift": "शिफ्ट प्लॅनर", "home.f.shiftDesc": "आज चालवण्यासाठी सर्वोत्तम वेळा", "home.f.shiftTag": "लाइव्ह",
  "home.f.heat": "उष्णता सुरक्षा", "home.f.heatDesc": "AQI · थकवा वेळ · पाणी पॉइंट्स", "home.f.heatTag": "आज जास्त",
  "home.f.rights": "तुमचे हक्क जाणा", "home.f.rightsDesc": "तुमच्या भाषेत कायदेशीर मदत", "home.f.rightsTag": "5 विषय",
  "home.tip": "लाइव्ह डिमांड व हवामानासह अपडेट · दिल्ली NCR",
  "common.rider": "रायडर", "common.ncr": "दिल्ली NCR",
  "shifts.title": "शिफ्ट प्लॅनर",
  "loc.locating": "शोधत आहोत…", "loc.located": "सापडले", "loc.ncr": "दिल्ली NCR",
  "shifts.top3": "आजच्या टॉप ३ वेळा", "shifts.projected": "अंदाजित",
  "shifts.workWindow": "कामाची वेळ", "shifts.hrs": "तास", "shifts.vsUsual": "नेहमीच्या तुलनेत",
  "shifts.showingSurge": "सर्ज डेटा दाखवत आहोत —",
  "shifts.liveSpots": "तुमच्या जवळ लाइव्ह ठिकाणे", "shifts.liveSpotsSub": "OpenStreetMap वरून खरी जवळची ठिकाणे · दिशेसाठी टॅप करा",
  "shifts.allWindows": "आजच्या सर्व वेळा",
  "shifts.ride": "राइड", "shifts.avoid": "टाळा",
  "shifts.earningsOutlook": "कमाईचा अंदाज", "shifts.earningsProjection": "कमाई प्रोजेक्शन",
  "shifts.eightWeeks": "RideKamao सोबत 8 आठवडे", "shifts.nowWeek": "आता / आठवडा", "shifts.week8": "आठवडा 8",
  "shifts.perHour": "प्रति तास", "shifts.whereWhy": "कुठे राहावे आणि का",
  "shifts.now": "आता", "shifts.avoidBadge": "टाळा", "shifts.rightNow": "आत्ता सुरू",
  "d.whereToBe": "कुठे राहावे", "d.bestSpots": "आता सर्वोत्तम ठिकाणे",
  "d.whyGood": "आता का चांगले आहे", "d.traffic": "वाहतूक",
  "d.cityZones": "जायला हवी अशी गजबजलेली ठिकाणे", "d.busyZone": "गजबजलेले ठिकाण · नकाशासाठी टॅप करा",
  "d.peak": "उच्च", "d.high": "जास्त", "d.good": "चांगले",
  "heat.title": "उष्णता सुरक्षा", "heat.updated": "अपडेट", "heat.refreshes": "दर तासाला रिफ्रेश · दिल्ली NCR",
  "heat.indexNcr": "हीट सेफ्टी इंडेक्स · दिल्ली NCR", "heat.takeBreaks": "नियमित ब्रेक घ्या आणि पाणी प्या",
  "heat.feelsLike": "जाणवते", "heat.rightNow": "आता", "heat.planBreaks": "तुमचे ब्रेक नियोजित करा",
  "heat.fatigue": "थकव्याची अंदाजित वेळ", "heat.fatigueSub": "जेव्हा शरीरावर उष्णतेचा सर्वाधिक ताण असतो",
  "heat.safe": "सुरक्षित", "heat.caution": "सावध", "heat.high": "जास्त", "heat.extreme": "खूप जास्त",
  "heat.sattu": "मोफत पाणी पॉइंट्स", "heat.nearby": "जवळ", "heat.mapLive": "नकाशा · लाइव्ह",
  "heat.tapPin": "काय मिळते ते पाहण्यासाठी पिन दाबा", "heat.you": "तुम्ही", "heat.directions": "मार्ग", "heat.openNow": "आता उघडे",
  "heat.beat": "आज उष्णतेवर मात करा",
  "heat.beatBody": "दर 30 मिनिटांनी 1 ग्लास पाणी · ORS ठेवा · सावलीत पार्क करा · हलके सुती कपडे. 12–3:30 ची वेळ टाळा.",
  "heat.avoidBanner": "आज 12:00 – 3:30 वाजता चालवणे टाळा. हीट इंडेक्स: 46°C",
  "heat.m.aqi": "AQI", "heat.m.temp": "तापमान", "heat.m.hum": "आर्द्रता", "heat.m.uv": "UV इंडेक्स",
  "ob.tagline": "राइड करा · कमवा · पुढे जा",
  "ob.heroTitle": "स्मार्ट चालवा,\nजास्त कमवा.",
  "ob.chooseLang": "तुमची भाषा निवडा · Language",
  "ob.getStarted": "सुरू करा", "ob.continue": "पुढे जा", "ob.buildPlan": "माझा प्लॅन बनवा",
  "ob.step": "स्टेप", "ob.of3": "/3",
  "ob.s1.title": "तुम्ही काय चालवता?", "ob.s1.sub": "आम्ही प्रत्येक सूचना तुमच्या कमाईनुसार बनवतो.",
  "ob.s2.title": "सर्वात महत्त्वाचे काय?", "ob.s2.sub": "जे योग्य वाटेल ते निवडा — तुमचा प्लॅन यावर बनेल.",
  "ob.s3.title": "तुमची माहिती", "ob.s3.sub": "तुमचा रोजचा प्लॅन आणि कमाई अहवाल — दररोज सकाळी तुमच्या इनबॉक्समध्ये.",
  "ob.name": "तुमचे नाव", "ob.namePh": "उदा. रमेश कुमार", "ob.email": "ईमेल", "ob.emailPh": "you@email.com",
  "ob.weeklyTarget": "आठवड्याचे कमाई target",
  "ob.building": "तुमचा प्लॅन बनत आहे…", "ob.fewSeconds": "फक्त काही सेकंद",
  "ob.gen1": "आजचे दिल्ली NCR हवामान व AQI वाचत आहोत", "ob.gen2": "लोकल इव्हेंट पाहत आहोत — वीकेंड व सण",
  "ob.gen3": "तुमच्या झोनचा सर्ज इतिहास जुळवत आहोत", "ob.gen4": "तुमचा personalised शिफ्ट प्लॅन बनवत आहोत",
  "pf.yours": "तुमची प्रोफाइल", "pf.setup": "प्रोफाइल सेट करा",
  "pf.profession": "व्यवसाय", "pf.language": "भाषा", "pf.weeklyTarget": "आठवड्याचे target", "pf.goals": "उद्दिष्टे",
  "pf.change": "बदला", "pf.editAll": "सर्व सेटिंग्ज बदला", "pf.reset": "रीसेट करा",
  "pf.setupBlurb": "personalised शिफ्ट प्लॅन, लोकेशन-आधारित सर्ज अलर्ट आणि कमाई अंदाजासाठी तुमची प्रोफाइल सेट करा.",
  "pf.perWeek": "/ आठवडा",
  "pf.signedInGoogle": "Google ने साइन इन आहे", "pf.signInGoogle": "Google ने साइन इन करा", "pf.signOut": "साइन आउट",
  "home.share": "WhatsApp वर शेअर करा", "home.install": "अ‍ॅप इन्स्टॉल करा",
  "home.installHint": "होम स्क्रीनवर जोडा · ऑफलाइन चालते · कमी डेटा",
  "common.estimated": "अंदाजित",
  "heat.live": "लाइव्ह", "heat.sample": "नमुना डेटा",
  "heat.safety": "सुरक्षा", "heat.call112": "112 वर कॉल करा", "heat.nearestHospital": "जवळचे रुग्णालय",
  "share.msg": "RideKamao — दिल्ली NCR रायडर्ससाठी स्मार्ट शिफ्ट प्लॅन. उष्णता टाळा, जास्त कमवा, तुमचे हक्क जाणा:",
  "ob.useGoogle": "Google ने पुढे जा", "ob.usingGoogle": "तुमचे Google खाते वापरले जात आहे", "ob.orType": "किंवा तुमची माहिती भरा",
  "heat.waterPoint": "पिण्याचे पाणी", "heat.noWater": "5 किमीच्या आत कोणताही मॅप केलेला पाणी पॉइंट नाही — नमुना पॉइंट दाखवत आहोत.",
  "heat.addWater": "+ इथे पाणी पॉइंट जोडा", "heat.addWaterPrompt": "या पाणी पॉइंटला नाव द्या (उदा. पेट्रोल पंप, मंदिर, दुकान):", "heat.added": "जोडले — धन्यवाद!",
  "earn.title": "कमाई", "earn.sub": "तुमच्या फोनवर खाजगी राहते", "earn.today": "आज नोंदवा", "earn.amount": "कमाई (₹)", "earn.hours": "कामाचे तास", "earn.save": "सेव्ह करा", "earn.thisWeek": "या आठवड्यात", "earn.target": "आठवड्याचे target", "earn.noEntries": "अजून कोणतीही नोंद नाही — वर तुमचा पहिला दिवस नोंदवा.", "earn.perHr": "/तास", "earn.recent": "अलीकडचे दिवस", "earn.open": "कमाई नोंदवा", "earn.expenses": "खर्च (₹)", "earn.expensesHint": "पेट्रोल · रिचार्ज · दुरुस्ती", "earn.net": "निव्वळ", "earn.gross": "एकूण", "earn.costs": "खर्च", "earn.platform": "प्लॅटफॉर्म", "earn.other": "इतर", "earn.edit": "बदला", "earn.delete": "काढा", "earn.update": "नोंद अपडेट करा", "earn.cancel": "रद्द करा", "earn.deleteConfirm": "ही नोंद काढायची?", "earn.netThisWeek": "या आठवड्यात निव्वळ कमाई", "earn.byPlatform": "प्लॅटफॉर्मनुसार", "earn.last7": "मागील 7 दिवस", "earn.bestDay": "सर्वोत्तम दिवस", "earn.avgPerHr": "सरासरी निव्वळ /तास", "earn.takeHome": "हातात", "earn.add": "नोंद जोडा", "nav.earn": "कमाई", "earn.tips": "टिप (₹)", "earn.trips": "ट्रिप", "earn.perTrip": "/ट्रिप", "heat.emergency": "आपत्कालीन सेवा", "heat.ambulance": "रुग्णवाहिका", "heat.police": "पोलीस", "heat.fire": "अग्निशमन", "heat.women": "महिला सुरक्षा", "heat.roadHelp": "रस्ता अपघात", "heat.callNow": "कॉलसाठी टॅप करा · मोफत 24×7", "schemes.title": "सरकारी योजना", "schemes.sub": "गिग कामगार म्हणून तुमच्या हक्काच्या सुविधा", "schemes.entryTitle": "तुमच्यासाठी सरकारी योजना", "schemes.entrySub": "पेन्शन, विमा व कामगार ID — मोफत सामील व्हा", "schemes.who": "कोण अर्ज करू शकतो", "schemes.cost": "खर्च", "schemes.how": "अर्ज कसा करावा", "schemes.gives": "काय मिळते", "schemes.apply": "अधिकृत वेबसाइट", "schemes.disclaimer": "माहिती बदलू शकते — अर्ज करण्यापूर्वी अधिकृत वेबसाइटवर खात्री करा.", "amen.all": "सर्व", "amen.water": "पाणी", "amen.toilet": "स्वच्छतागृह", "amen.food": "जेवण", "amen.rest": "विश्रांती/सावली", "amen.ev": "EV चार्ज", "amen.parking": "पार्किंग", "heat.amenities": "रायडर सुविधा", "heat.addSpot": "+ इथे ठिकाण जोडा", "amen.namePh": "नाव (उदा. पेट्रोल पंप, बाजार)", "amen.addBtn": "जोडा", "amen.none": "5 किमीमध्ये अजून काही नाही — खाली जोडा.", "voice.listen": "बोला", "voice.listening": "ऐकत आहोत…", "voice.play": "ऐका",
};

const DICT: Record<UILang, Partial<Record<Key, string>>> & { en: Record<Key, string> } = { en, hi, pa, bn, ta, mr };

function fmt(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

/** Pure translator (use in non-hook contexts like onboarding's local state). */
export function tr(lang: string, key: Key, vars?: Record<string, string | number>): string {
  const l = resolveLang(lang);
  return fmt(DICT[l][key] ?? DICT.en[key], vars);
}

/** Hook: returns a translator bound to the signed-in profile's language. */
export function useT() {
  const { profile } = useProfile();
  const lang = resolveLang(profile?.language);
  return (key: Key, vars?: Record<string, string | number>) => fmt(DICT[lang][key] ?? DICT.en[key], vars);
}

export function useLang(): UILang {
  const { profile } = useProfile();
  return resolveLang(profile?.language);
}

// ── Profession & goal translations (keyed by lang → id) ───────
type PT = { title: string; sub: string };
const PROF_TR: Partial<Record<UILang, Record<string, PT>>> = {
  hi: {
    food: { title: "फूड डिलीवरी राइडर", sub: "Zomato · Swiggy" },
    auto: { title: "ऑटो-रिक्शा ड्राइवर", sub: "सड़क व ऐप दोनों" },
    biketx: { title: "बाइक टैक्सी राइडर", sub: "Rapido · Uber Moto" },
    cab: { title: "कैब ड्राइवर", sub: "Ola · Uber" },
    qcom: { title: "क्विक-कॉमर्स राइडर", sub: "Blinkit · Zepto · Instamart" },
  },
  pa: {
    food: { title: "ਫੂਡ ਡਿਲੀਵਰੀ ਰਾਈਡਰ", sub: "Zomato · Swiggy" },
    auto: { title: "ਆਟੋ-ਰਿਕਸ਼ਾ ਡਰਾਈਵਰ", sub: "ਸੜਕ ਤੇ ਐਪ ਦੋਵੇਂ" },
    biketx: { title: "ਬਾਈਕ ਟੈਕਸੀ ਰਾਈਡਰ", sub: "Rapido · Uber Moto" },
    cab: { title: "ਕੈਬ ਡਰਾਈਵਰ", sub: "Ola · Uber" },
    qcom: { title: "ਕਵਿੱਕ-ਕਾਮਰਸ ਰਾਈਡਰ", sub: "Blinkit · Zepto · Instamart" },
  },
  bn: {
    food: { title: "ফুড ডেলিভারি রাইডার", sub: "Zomato · Swiggy" },
    auto: { title: "অটো-রিকশা চালক", sub: "রাস্তা ও অ্যাপ দুটোই" },
    biketx: { title: "বাইক ট্যাক্সি রাইডার", sub: "Rapido · Uber Moto" },
    cab: { title: "ক্যাব চালক", sub: "Ola · Uber" },
    qcom: { title: "কুইক-কমার্স রাইডার", sub: "Blinkit · Zepto · Instamart" },
  },
  ta: {
    food: { title: "உணவு டெலிவரி ரைடர்", sub: "Zomato · Swiggy" },
    auto: { title: "ஆட்டோ-ரிக்ஷா டிரைவர்", sub: "சாலை & ஆப் இரண்டும்" },
    biketx: { title: "பைக் டாக்ஸி ரைடர்", sub: "Rapido · Uber Moto" },
    cab: { title: "கேப் டிரைவர்", sub: "Ola · Uber" },
    qcom: { title: "க்விக்-காமர்ஸ் ரைடர்", sub: "Blinkit · Zepto · Instamart" },
  },
  mr: {
    food: { title: "फूड डिलिव्हरी रायडर", sub: "Zomato · Swiggy" },
    auto: { title: "ऑटो-रिक्षा चालक", sub: "रस्ता व अ‍ॅप दोन्ही" },
    biketx: { title: "बाईक टॅक्सी रायडर", sub: "Rapido · Uber Moto" },
    cab: { title: "कॅब चालक", sub: "Ola · Uber" },
    qcom: { title: "क्विक-कॉमर्स रायडर", sub: "Blinkit · Zepto · Instamart" },
  },
};

type GT = { title: string; sub: string; short: string };
const GOAL_TR: Partial<Record<UILang, Record<string, GT>>> = {
  hi: {
    earn: { title: "रोज़ की कमाई बढ़ाओ", sub: "हर घंटे से ज़्यादा कमाएँ", short: "कमाई" },
    target: { title: "हफ़्ते का target पूरा करो", sub: "एक नंबर से उल्टा प्लान करें", short: "Target" },
    heat: { title: "गर्मी से बचें, सुरक्षित रहें", sub: "खतरनाक दोपहर के घंटे टालें", short: "गर्मी" },
    traffic: { title: "ट्रैफ़िक व लंबी ट्रिप से बचें", sub: "कम बेकार किलोमीटर", short: "ट्रैफ़िक" },
  },
  pa: {
    earn: { title: "ਰੋਜ਼ ਦੀ ਕਮਾਈ ਵਧਾਓ", sub: "ਹਰ ਘੰਟੇ ਤੋਂ ਵੱਧ ਕਮਾਓ", short: "ਕਮਾਈ" },
    target: { title: "ਹਫ਼ਤੇ ਦਾ target ਪੂਰਾ ਕਰੋ", sub: "ਇੱਕ ਨੰਬਰ ਤੋਂ ਉਲਟਾ ਪਲਾਨ ਕਰੋ", short: "Target" },
    heat: { title: "ਗਰਮੀ ਤੋਂ ਬਚੋ, ਸੁਰੱਖਿਅਤ ਰਹੋ", sub: "ਖ਼ਤਰਨਾਕ ਦੁਪਹਿਰ ਦੇ ਘੰਟੇ ਟਾਲੋ", short: "ਗਰਮੀ" },
    traffic: { title: "ਟ੍ਰੈਫ਼ਿਕ ਤੇ ਲੰਮੀ ਟ੍ਰਿਪ ਤੋਂ ਬਚੋ", sub: "ਘੱਟ ਬੇਕਾਰ ਕਿਲੋਮੀਟਰ", short: "ਟ੍ਰੈਫ਼ਿਕ" },
  },
  bn: {
    earn: { title: "প্রতিদিনের আয় বাড়ান", sub: "প্রতি ঘণ্টায় বেশি আয় করুন", short: "আয়" },
    target: { title: "সাপ্তাহিক target পূরণ করুন", sub: "একটি সংখ্যা থেকে পেছন থেকে প্ল্যান করুন", short: "Target" },
    heat: { title: "গরম এড়ান, নিরাপদ থাকুন", sub: "বিপজ্জনক দুপুরের সময় এড়ান", short: "গরম" },
    traffic: { title: "ট্রাফিক ও দীর্ঘ ট্রিপ এড়ান", sub: "কম অপচয় কিলোমিটার", short: "ট্রাফিক" },
  },
  ta: {
    earn: { title: "தினசரி வருமானத்தை அதிகரி", sub: "ஒவ்வொரு மணியிலும் அதிகம் சம்பாதி", short: "வருமானம்" },
    target: { title: "வாராந்திர target-ஐ அடை", sub: "ஒரு எண்ணிலிருந்து திட்டமிடு", short: "Target" },
    heat: { title: "வெப்பத்தைத் தவிர், பாதுகாப்பாக இரு", sub: "ஆபத்தான மதிய நேரத்தைத் தவிர்", short: "வெப்பம்" },
    traffic: { title: "போக்குவரத்து & நீண்ட பயணம் தவிர்", sub: "குறைவான வீண் கிலோமீட்டர்", short: "போக்குவரத்து" },
  },
  mr: {
    earn: { title: "रोजची कमाई वाढवा", sub: "प्रत्येक तासाला जास्त कमवा", short: "कमाई" },
    target: { title: "आठवड्याचे target पूर्ण करा", sub: "एका आकड्यावरून उलट नियोजन करा", short: "Target" },
    heat: { title: "उष्णता टाळा, सुरक्षित राहा", sub: "धोकादायक दुपारचे तास टाळा", short: "उष्णता" },
    traffic: { title: "वाहतूक व लांब ट्रिप टाळा", sub: "कमी वाया किलोमीटर", short: "वाहतूक" },
  },
};

export function profTitle(id: string, lang: string): string {
  const p = PROFESSIONS.find((x) => x.id === id);
  return PROF_TR[resolveLang(lang)]?.[id]?.title ?? p?.title ?? id;
}
export function profSub(id: string, lang: string): string {
  const p = PROFESSIONS.find((x) => x.id === id);
  return PROF_TR[resolveLang(lang)]?.[id]?.sub ?? p?.sub ?? "";
}
export function goalTitle(id: string, lang: string): string {
  const g = GOALS.find((x) => x.id === id);
  return GOAL_TR[resolveLang(lang)]?.[id]?.title ?? g?.title ?? id;
}
export function goalSub(id: string, lang: string): string {
  const g = GOALS.find((x) => x.id === id);
  return GOAL_TR[resolveLang(lang)]?.[id]?.sub ?? g?.sub ?? "";
}
export function goalShort(id: string, lang: string): string {
  return GOAL_TR[resolveLang(lang)]?.[id]?.short ?? (id.charAt(0).toUpperCase() + id.slice(1));
}
