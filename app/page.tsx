"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, FileText, CalendarDays, Quote, ArrowRight, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useProfile } from "@/lib/ridekamao-profile";
import { windowsFor, getProfession, HEAT } from "@/lib/ridekamao-data";

const G = {
  green: "#0E9A6E", green700: "#057A55", green50: "#E8F6EF",
  ink: "#0C1A14", muted: "#5E6E66", faint: "#8A9A92",
  line: "#E3EAE6", surface: "#FFFFFF", bg: "#EEF3F0",
  amberBg: "#FBEBCF", amberInk: "#8A5208",
};

interface Assignment {
  id: string; title: string; subject: string;
  dueDate: string; status: "pending" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const studyFeatures = [
  { href: "/assignments", icon: ClipboardList, label: "Assignments", desc: "Track deadlines & progress",  color: "text-violet-500", bg: "bg-violet-500/10" },
  { href: "/notes",       icon: FileText,      label: "AI Notes",    desc: "Summarise lectures with Claude", color: "text-blue-500",   bg: "bg-blue-500/10"   },
  { href: "/schedule",    icon: CalendarDays,  label: "Schedule",    desc: "Manage your timetable",      color: "text-emerald-500",bg: "bg-emerald-500/10"},
  { href: "/citations",   icon: Quote,         label: "Citations",   desc: "Format references instantly", color: "text-amber-500",  bg: "bg-amber-500/10"  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { profile, loading } = useProfile();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  useEffect(() => {
    const stored = localStorage.getItem("studyhub-assignments");
    if (stored) setAssignments(JSON.parse(stored));
  }, []);

  const pending = assignments.filter((a) => a.status !== "done");
  const due = pending.filter((a) => {
    const d = new Date(a.dueDate);
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  });

  const profession = profile ? getProfession(profile.profession) : null;
  const windows = profile ? windowsFor(profile.profession) : null;
  const bestWindow = windows?.[0];

  return (
    <div style={{ background: G.bg, minHeight: "100%", padding: "0 0 40px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 0" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: G.muted, fontWeight: 600 }}>{dateStr}</div>
            <h1 style={{ margin: "4px 0 0", fontWeight: 800, fontSize: 30, letterSpacing: "-.7px", color: G.ink }}>
              {greeting()}{profile?.name ? `, ${profile.name}` : ""} 👋
            </h1>
          </div>
        </motion.div>

        {/* RideKamao hero — only if profile exists */}
        {!loading && profile && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div
              style={{
                borderRadius: 22, padding: "20px 20px 18px", marginBottom: 24,
                position: "relative", overflow: "hidden",
                background: "linear-gradient(155deg,#0FA075,#067352 85%)",
                boxShadow: "0 22px 44px -22px rgba(6,115,82,.6)",
              }}
            >
              <div style={{ position: "absolute", top: -50, right: -30, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.18), transparent 65%)" }} />
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{profession?.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12.5, letterSpacing: ".8px", textTransform: "uppercase", color: "rgba(255,255,255,.8)" }}>
                        Today's shift
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: "#fff" }}>{profession?.title}</div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: 7, padding: "7px 12px",
                      borderRadius: 12, background: G.amberBg,
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#E0700B", animation: "rk-pulse 1.6s infinite", display: "inline-block" }} />
                    <span style={{ fontWeight: 700, fontSize: 12, color: G.amberInk }}>Heat HIGH · 46°</span>
                  </div>
                </div>
                {bestWindow && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,.75)", marginBottom: 4 }}>Best window today</div>
                    <div style={{ fontWeight: 800, fontSize: 24, color: "#fff", letterSpacing: "-.5px", fontVariantNumeric: "tabular-nums" }}>
                      {bestWindow.time}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,.85)", marginTop: 2 }}>
                      ₹{bestWindow.rphr}/hr · {bestWindow.label}
                    </div>
                  </div>
                )}
                <Link
                  href="/shifts"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14,
                    padding: "9px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,.2)", color: "#fff",
                    fontWeight: 700, fontSize: 13.5, textDecoration: "none",
                    border: "1px solid rgba(255,255,255,.3)",
                    transition: "background .16s",
                  }}
                >
                  View full shift plan →
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* No profile prompt */}
        {!loading && !profile && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div
              style={{
                borderRadius: 22, padding: "20px 20px 20px", marginBottom: 24,
                background: "linear-gradient(155deg,#0FA075,#067352 85%)",
                boxShadow: "0 22px 44px -22px rgba(6,115,82,.6)",
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: -40, right: -30, width: 170, height: 170, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.18), transparent 65%)" }} />
              <div style={{ position: "relative" }}>
                <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 12.5, letterSpacing: ".8px", textTransform: "uppercase", color: "rgba(255,255,255,.8)" }}>
                  RideKamao
                </p>
                <h2 style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 22, letterSpacing: "-.5px", color: "#fff" }}>
                  Set up your rider profile
                </h2>
                <p style={{ margin: "0 0 16px", fontSize: 14, color: "rgba(255,255,255,.85)", lineHeight: 1.5 }}>
                  Get personalised shift windows, heat safety alerts, and earnings projections for Delhi NCR.
                </p>
                <Link
                  href="/onboarding"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "10px 18px", borderRadius: 12,
                    background: "#fff", color: G.green700,
                    fontWeight: 700, fontSize: 13.5, textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,.12)",
                  }}
                >
                  ✨ Get started →
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick stats */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Pending", value: pending.length, icon: Clock, color: "text-blue-500" },
            { label: "Due soon", value: due.length, icon: TrendingUp, color: "text-red-500" },
            { label: "Shifts today", value: 3, icon: CalendarDays, color: "text-emerald-500" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={item}>
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                    <stat.icon className={`w-7 h-7 ${stat.color} opacity-60`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Study tools */}
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: ".6px", textTransform: "uppercase", color: G.faint }}>
            Study tools
          </span>
        </div>
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {studyFeatures.map((f) => (
            <motion.div key={f.href} variants={item} whileHover={{ y: -2 }}>
              <Link href={f.href}>
                <Card className="group border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${f.bg}`}>
                      <f.icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{f.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{f.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Due soon list */}
        {due.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: ".6px", textTransform: "uppercase", color: G.faint }}>
                Due in 3 days
              </span>
            </div>
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-0">
                {due.map((a, i) => (
                  <div key={a.id} className={`flex items-center gap-3 px-4 py-3 ${i < due.length - 1 ? "border-b border-border/40" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.subject}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(a.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
