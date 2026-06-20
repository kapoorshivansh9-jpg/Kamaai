"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ExternalLink, IdCard, PiggyBank, Umbrella, HeartPulse, ShieldCheck, Info } from "lucide-react";
import { useT, useLang } from "@/lib/i18n";

const G = {
  ink: "#05160E", ink2: "#163022", muted: "#456055", faint: "#7A9A8A",
  line: "#BDD8C8", line2: "#DDF0E6", surface: "#FFFFFF", bg: "#EBF7F1",
  green: "#0A9060", green50: "#D8F5E8", green100: "#B4EAD0", green700: "#045234",
};

type Bi = { en: string; hi: string };
type BiList = { en: string[]; hi: string[] };
interface Scheme {
  id: string;
  Icon: typeof IdCard;
  name: Bi;
  tag: Bi;
  gives: Bi;
  who: Bi;
  cost: Bi;
  how: BiList;
  url: string;
  helpline?: string;
}

const SCHEMES: Scheme[] = [
  {
    id: "eshram",
    Icon: IdCard,
    name: { en: "e-Shram Card", hi: "ई-श्रम कार्ड" },
    tag: { en: "Free · Worker ID", hi: "मुफ़्त · वर्कर ID" },
    gives: {
      en: "A national ID for unorganised workers, ₹2 lakh accidental insurance, and a single gateway to welfare schemes.",
      hi: "असंगठित कामगारों के लिए राष्ट्रीय पहचान, ₹2 लाख दुर्घटना बीमा, और कल्याण योजनाओं का एक ही द्वार।",
    },
    who: {
      en: "Any unorganised worker aged 16–59 (delivery, driver, etc.) who is not an income-tax payer and not in EPFO/ESIC.",
      hi: "16–59 साल का कोई भी असंगठित कामगार (डिलीवरी, ड्राइवर आदि) जो इनकम टैक्स न भरता हो और EPFO/ESIC में न हो।",
    },
    cost: { en: "Free", hi: "मुफ़्त" },
    how: {
      en: [
        "Keep Aadhaar, a bank account, and a mobile number linked to Aadhaar ready",
        "Go to eshram.gov.in → ‘Register on eShram’, or visit a CSC centre",
        "Verify with the Aadhaar OTP and fill in your work details",
        "Download your e-Shram card with a 12-digit UAN number",
      ],
      hi: [
        "आधार, बैंक खाता और आधार से जुड़ा मोबाइल नंबर तैयार रखें",
        "eshram.gov.in → ‘Register on eShram’ पर जाएँ, या CSC केंद्र जाएँ",
        "आधार OTP से सत्यापन करें और काम की जानकारी भरें",
        "12 अंकों के UAN वाला अपना ई-श्रम कार्ड डाउनलोड करें",
      ],
    },
    url: "https://eshram.gov.in",
  },
  {
    id: "pmsym",
    Icon: PiggyBank,
    name: { en: "PM-SYM Pension", hi: "पीएम-श्रम योगी मानधन पेंशन" },
    tag: { en: "₹3,000/month pension", hi: "₹3,000 मासिक पेंशन" },
    gives: {
      en: "A guaranteed ₹3,000 per month pension after age 60. The government adds the same amount you contribute.",
      hi: "60 साल के बाद हर महीने ₹3,000 की गारंटीड पेंशन। सरकार आपके बराबर योगदान देती है।",
    },
    who: {
      en: "Unorganised workers aged 18–40 with monthly income up to ₹15,000, not in EPFO/ESIC/NPS.",
      hi: "18–40 साल के असंगठित कामगार, मासिक आय ₹15,000 तक, जो EPFO/ESIC/NPS में न हों।",
    },
    cost: { en: "₹55–₹200/month by age (the government pays the same).", hi: "उम्र के अनुसार ₹55–₹200 मासिक (सरकार उतना ही देती है)।" },
    how: {
      en: [
        "Keep Aadhaar and a savings / Jan-Dhan bank account ready",
        "Visit your nearest CSC (Common Service Centre)",
        "Enrol with Aadhaar + bank details and pay the first contribution",
        "Auto-debit then continues monthly from your bank",
      ],
      hi: [
        "आधार और बचत / जन-धन बैंक खाता तैयार रखें",
        "अपने नज़दीकी CSC (कॉमन सर्विस सेंटर) जाएँ",
        "आधार + बैंक जानकारी से नामांकन करें और पहला योगदान दें",
        "इसके बाद हर महीने बैंक से अपने-आप कटौती होती रहेगी",
      ],
    },
    url: "https://maandhan.in",
  },
  {
    id: "pmsby",
    Icon: Umbrella,
    name: { en: "PMSBY Accident Cover", hi: "पीएमएसबीवाई दुर्घटना बीमा" },
    tag: { en: "₹2 lakh for ₹20/year", hi: "₹20 में ₹2 लाख / साल" },
    gives: {
      en: "₹2 lakh for accidental death or full disability, ₹1 lakh for partial disability.",
      hi: "दुर्घटना में मृत्यु या पूर्ण विकलांगता पर ₹2 लाख, आंशिक विकलांगता पर ₹1 लाख।",
    },
    who: { en: "Anyone aged 18–70 who has a bank account.", hi: "18–70 साल का कोई भी व्यक्ति जिसके पास बैंक खाता हो।" },
    cost: { en: "₹20 per year (auto-debited).", hi: "₹20 प्रति साल (ऑटो-डेबिट)।" },
    how: {
      en: [
        "Ask your bank, or use net / mobile banking",
        "Opt in to PMSBY and allow the ₹20/year auto-debit",
        "Cover runs 1 June–31 May and renews every year",
      ],
      hi: [
        "अपने बैंक से कहें, या नेट / मोबाइल बैंकिंग इस्तेमाल करें",
        "PMSBY चुनें और ₹20/साल ऑटो-डेबिट की अनुमति दें",
        "कवर 1 जून–31 मई तक चलता है और हर साल नवीनीकृत होता है",
      ],
    },
    url: "https://www.jansuraksha.gov.in",
  },
  {
    id: "pmjjby",
    Icon: ShieldCheck,
    name: { en: "PMJJBY Life Cover", hi: "पीएमजेजेबीवाई जीवन बीमा" },
    tag: { en: "₹2 lakh life cover", hi: "₹2 लाख जीवन बीमा" },
    gives: {
      en: "₹2 lakh paid to your family on death from any cause.",
      hi: "किसी भी कारण से मृत्यु होने पर परिवार को ₹2 लाख।",
    },
    who: { en: "Anyone aged 18–50 who has a bank account.", hi: "18–50 साल का कोई भी व्यक्ति जिसके पास बैंक खाता हो।" },
    cost: { en: "₹436 per year.", hi: "₹436 प्रति साल।" },
    how: {
      en: [
        "Ask your bank, or use net / mobile banking",
        "Opt in to PMJJBY and allow the ₹436/year auto-debit",
        "Cover runs 1 June–31 May and renews every year",
      ],
      hi: [
        "अपने बैंक से कहें, या नेट / मोबाइल बैंकिंग इस्तेमाल करें",
        "PMJJBY चुनें और ₹436/साल ऑटो-डेबिट की अनुमति दें",
        "कवर 1 जून–31 मई तक चलता है और हर साल नवीनीकृत होता है",
      ],
    },
    url: "https://www.jansuraksha.gov.in",
  },
  {
    id: "pmjay",
    Icon: HeartPulse,
    name: { en: "Ayushman Bharat (PM-JAY)", hi: "आयुष्मान भारत (PM-JAY)" },
    tag: { en: "₹5 lakh health cover", hi: "₹5 लाख स्वास्थ्य बीमा" },
    gives: {
      en: "Free hospital treatment up to ₹5 lakh per family per year at empanelled hospitals.",
      hi: "सूचीबद्ध अस्पतालों में परिवार को हर साल ₹5 लाख तक मुफ़्त इलाज।",
    },
    who: {
      en: "Families in the eligible list (gig workers are increasingly being included — check your eligibility).",
      hi: "पात्र सूची के परिवार (गिग वर्कर तेज़ी से शामिल किए जा रहे हैं — अपनी पात्रता जाँचें)।",
    },
    cost: { en: "Free", hi: "मुफ़्त" },
    how: {
      en: [
        "Check eligibility at pmjay.gov.in or call the 14555 helpline",
        "If eligible, get your Ayushman card at a CSC or empanelled hospital",
        "Show the card at the hospital for cashless treatment",
      ],
      hi: [
        "pmjay.gov.in पर पात्रता जाँचें या 14555 हेल्पलाइन पर कॉल करें",
        "पात्र होने पर CSC या सूचीबद्ध अस्पताल से आयुष्मान कार्ड बनवाएँ",
        "कैशलेस इलाज के लिए अस्पताल में कार्ड दिखाएँ",
      ],
    },
    url: "https://pmjay.gov.in",
    helpline: "14555",
  },
];

export default function SchemesPage() {
  const t = useT();
  const lang = useLang();
  const [open, setOpen] = useState<string | null>("eshram");
  const pick = (b: Bi) => (lang === "hi" ? b.hi : b.en);
  const pickList = (b: BiList) => (lang === "hi" ? b.hi : b.en);

  return (
    <div style={{ background: G.bg, minHeight: "100%", paddingBottom: 28 }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ padding: "18px 20px 0" }}>
          <Link href="/rights" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: G.muted, textDecoration: "none", fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>
            <ArrowLeft size={16} /> {t("nav.rights")}
          </Link>
          <h1 style={{ margin: "0 0 3px", fontWeight: 800, fontSize: 26, letterSpacing: "-.6px", color: G.ink }}>{t("schemes.title")}</h1>
          <div style={{ fontSize: 13, color: G.muted }}>{t("schemes.sub")}</div>
        </div>

        {/* Scheme cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 11, margin: "18px 20px 0" }}>
          {SCHEMES.map((s) => {
            const isOpen = open === s.id;
            return (
              <div key={s.id} style={{ background: G.surface, borderRadius: 18, border: `1.5px solid ${isOpen ? G.green : G.line}`, overflow: "hidden", boxShadow: isOpen ? "0 12px 30px -16px rgba(4,77,51,.4)" : "0 2px 8px -4px rgba(10,24,18,.1)", transition: "border-color .2s" }}>
                <button onClick={() => setOpen(isOpen ? null : s.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "15px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: G.green50, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <s.Icon size={22} color={G.green700} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15.5, color: G.ink, lineHeight: 1.2 }}>{pick(s.name)}</div>
                    <div style={{ display: "inline-block", marginTop: 5, fontSize: 11.5, fontWeight: 800, color: G.green700, background: G.green50, padding: "2px 9px", borderRadius: 7 }}>{pick(s.tag)}</div>
                  </div>
                  <ChevronDown size={20} color={G.faint} style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .25s" }} />
                </button>

                {isOpen && (
                  <div style={{ padding: "0 16px 16px" }}>
                    <div style={{ fontSize: 13.5, color: G.ink2, lineHeight: 1.55, paddingBottom: 14, borderBottom: `1px solid ${G.line2}` }}>{pick(s.gives)}</div>

                    <Field label={t("schemes.who")} value={pick(s.who)} />
                    <Field label={t("schemes.cost")} value={pick(s.cost)} />

                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".6px", color: G.faint, marginBottom: 9 }}>{t("schemes.how")}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                        {pickList(s.how).map((step, i) => (
                          <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                            <span style={{ width: 21, height: 21, borderRadius: "50%", background: G.green, color: "#fff", fontSize: 11.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                            <span style={{ fontSize: 13, color: G.ink2, lineHeight: 1.5 }}>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, height: 46, borderRadius: 13, background: "linear-gradient(180deg,#0B6B48,#064D33)", color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: 14 }}>
                      <ExternalLink size={16} /> {t("schemes.apply")}{s.helpline ? ` · ${s.helpline}` : ""}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div style={{ display: "flex", gap: 9, alignItems: "flex-start", margin: "16px 20px 0", padding: "12px 14px", background: "#FFF8E8", borderRadius: 13, border: "1px solid #F3E2B5" }}>
          <Info size={15} color="#9A7A1E" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11.5, color: "#7A6219", lineHeight: 1.5 }}>{t("schemes.disclaimer")}</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".6px", color: G.faint, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: G.ink2, lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}
