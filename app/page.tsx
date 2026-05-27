"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardList,
  FileText,
  CalendarDays,
  Quote,
  ArrowRight,
  BookOpen,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: "pending" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
}

const features = [
  {
    href: "/assignments",
    icon: ClipboardList,
    label: "Assignments",
    desc: "Track deadlines & progress",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    href: "/notes",
    icon: FileText,
    label: "AI Notes",
    desc: "Summarise lectures with AI",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    href: "/schedule",
    icon: CalendarDays,
    label: "Schedule",
    desc: "Manage your timetable",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    href: "/citations",
    icon: Quote,
    label: "Citations",
    desc: "Format references instantly",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("studyhub-assignments");
    if (stored) setAssignments(JSON.parse(stored));
  }, []);

  const pending = assignments.filter((a) => a.status !== "done");
  const due = pending.filter((a) => {
    const d = new Date(a.dueDate);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  });
  const done = assignments.filter((a) => a.status === "done").length;

  const priorityColour = { high: "destructive", medium: "secondary", low: "outline" } as const;

  return (
    <div className="min-h-screen p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-violet-600 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 opacity-80" />
              <span className="text-sm opacity-80">StudyHub</span>
            </div>
            <h1 className="text-3xl font-bold mb-1">{greeting()} 👋</h1>
            <p className="text-white/70 text-sm">
              {pending.length === 0
                ? "You're all caught up! Great work."
                : `You have ${pending.length} assignment${pending.length > 1 ? "s" : ""} pending.`}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10"
      >
        {[
          { label: "Pending", value: pending.length, icon: Clock, color: "text-blue-500" },
          { label: "Due Soon", value: due.length, icon: TrendingUp, color: "text-red-500" },
          { label: "Completed", value: done, icon: ClipboardList, color: "text-emerald-500" },
        ].map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
      >
        {features.map((f) => (
          <motion.div key={f.href} variants={item} whileHover={{ y: -2 }}>
            <Link href={f.href}>
              <Card className="group border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${f.bg}`}>
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

      {due.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                Due in the next 3 days
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {due.map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.subject}</p>
                  </div>
                  <Badge variant={priorityColour[a.priority]} className="text-xs shrink-0">
                    {a.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(a.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
              <Link href="/assignments" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full mt-1 text-primary")}>
                View all assignments
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {assignments.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Card className="border-dashed border-border/60 bg-muted/30 text-center">
            <CardContent className="py-12">
              <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-muted-foreground text-sm">No assignments yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Add your first assignment to get started</p>
              <Link href="/assignments" className={buttonVariants({ size: "sm" })}>
                Add Assignment
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
