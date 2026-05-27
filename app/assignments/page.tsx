"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: "pending" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  notes: string;
  createdAt: string;
}

const STORAGE_KEY = "studyhub-assignments";

const priorityConfig = {
  high: { label: "High", variant: "destructive" as const, icon: AlertCircle, color: "text-red-500" },
  medium: { label: "Medium", variant: "secondary" as const, icon: Clock, color: "text-amber-500" },
  low: { label: "Low", variant: "outline" as const, icon: Circle, color: "text-emerald-500" },
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-slate-400" },
  "in-progress": { label: "In Progress", color: "bg-blue-500" },
  done: { label: "Done", color: "bg-emerald-500" },
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high",
    notes: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setAssignments(JSON.parse(stored));
  }, []);

  function save(updated: Assignment[]) {
    setAssignments(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function addAssignment() {
    if (!form.title || !form.subject || !form.dueDate) {
      toast.error("Please fill in title, subject, and due date.");
      return;
    }
    const newA: Assignment = {
      id: crypto.randomUUID(),
      ...form,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    save([...assignments, newA]);
    setForm({ title: "", subject: "", dueDate: "", priority: "medium", notes: "" });
    setOpen(false);
    toast.success("Assignment added!");
  }

  function updateStatus(id: string, status: Assignment["status"]) {
    save(assignments.map((a) => (a.id === id ? { ...a, status } : a)));
    if (status === "done") toast.success("Assignment marked done! 🎉");
  }

  function deleteAssignment(id: string) {
    save(assignments.filter((a) => a.id !== id));
    toast.info("Assignment removed.");
  }

  const filtered =
    filter === "all" ? assignments : assignments.filter((a) => a.status === filter);

  const total = assignments.length;
  const done = assignments.filter((a) => a.status === "done").length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  function daysUntil(dateStr: string) {
    const diff = Math.ceil(
      (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (diff < 0) return { label: "Overdue", urgent: true };
    if (diff === 0) return { label: "Due today", urgent: true };
    if (diff === 1) return { label: "Due tomorrow", urgent: true };
    return { label: `${diff}d left`, urgent: false };
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Assignments</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track and manage your coursework</p>
          </div>
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" /> Add Assignment
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Assignment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g. Essay on Climate Change"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Input
                    placeholder="e.g. Geography"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select
                      value={form.priority}
                      onValueChange={(v) => v && setForm({ ...form, priority: v as Assignment["priority"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="Any extra details..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button className="w-full" onClick={addAssignment}>
                  Add Assignment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {total > 0 && (
          <Card className="border-border/50 shadow-sm mb-6">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {done} of {total} completed
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs value={filter} onValueChange={(v) => v && setFilter(v)}>
          <TabsList>
            <TabsTrigger value="all">All ({assignments.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({assignments.filter((a) => a.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress ({assignments.filter((a) => a.status === "in-progress").length})
            </TabsTrigger>
            <TabsTrigger value="done">
              Done ({assignments.filter((a) => a.status === "done").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 text-muted-foreground"
          >
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No assignments here</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => {
              const { label: dueLabel, urgent } = daysUntil(a.dueDate);
              const PriorityIcon = priorityConfig[a.priority].icon;
              return (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Card className={`border-border/50 shadow-sm transition-opacity ${a.status === "done" ? "opacity-60" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() =>
                            updateStatus(a.id, a.status === "done" ? "pending" : "done")
                          }
                          className="mt-0.5 shrink-0"
                        >
                          {a.status === "done" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground/50 hover:text-primary transition-colors" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-medium text-sm ${a.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                              {a.title}
                            </p>
                            <Badge variant={priorityConfig[a.priority].variant} className="text-xs h-5">
                              {a.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground">{a.subject}</span>
                            <span className={`text-xs font-medium ${urgent ? "text-red-500" : "text-muted-foreground"}`}>
                              {dueLabel}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[a.status].color}`} />
                              <span className="text-xs text-muted-foreground">{statusConfig[a.status].label}</span>
                            </div>
                          </div>
                          {a.notes && (
                            <p className="text-xs text-muted-foreground/70 mt-1.5 line-clamp-1">{a.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {a.status !== "in-progress" && a.status !== "done" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-blue-500 hover:text-blue-600 px-2"
                              onClick={() => updateStatus(a.id, "in-progress")}
                            >
                              Start
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteAssignment(a.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
