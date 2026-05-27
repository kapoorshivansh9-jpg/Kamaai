"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
  type: "class" | "study" | "deadline" | "other";
  colour: string;
}

const STORAGE_KEY = "studyhub-schedule";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const typeConfig = {
  class: { label: "Class", colour: "bg-blue-500" },
  study: { label: "Study", colour: "bg-violet-500" },
  deadline: { label: "Deadline", colour: "bg-red-500" },
  other: { label: "Other", colour: "bg-slate-500" },
};

const COLOURS = [
  { label: "Blue", value: "bg-blue-500" },
  { label: "Violet", value: "bg-violet-500" },
  { label: "Emerald", value: "bg-emerald-500" },
  { label: "Amber", value: "bg-amber-500" },
  { label: "Red", value: "bg-red-500" },
  { label: "Pink", value: "bg-pink-500" },
];

export default function SchedulePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    day: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    type: "class" as Event["type"],
    colour: "bg-blue-500",
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setEvents(JSON.parse(stored));
  }, []);

  function save(updated: Event[]) {
    setEvents(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function addEvent() {
    if (!form.title) { toast.error("Please enter a title."); return; }
    const newEvent: Event = { id: crypto.randomUUID(), ...form };
    save([...events, newEvent]);
    setForm({ title: "", day: "Monday", startTime: "09:00", endTime: "10:00", type: "class", colour: "bg-blue-500" });
    setOpen(false);
    toast.success("Event added!");
  }

  function deleteEvent(id: string) {
    save(events.filter((e) => e.id !== id));
    toast.info("Event removed.");
  }

  const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  function eventsForDay(day: string) {
    return events
      .filter((e) => e.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Weekly Schedule</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your classes and study sessions</p>
          </div>
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" /> Add Event
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g. Mathematics Lecture"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Day</Label>
                    <Select value={form.day} onValueChange={(v) => v && setForm({ ...form, day: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v as Event["type"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="class">Class</SelectItem>
                        <SelectItem value="study">Study</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Start Time</Label>
                    <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>End Time</Label>
                    <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Colour</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOURS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setForm({ ...form, colour: c.value })}
                        className={`w-7 h-7 rounded-full ${c.value} transition-transform ${form.colour === c.value ? "scale-125 ring-2 ring-offset-2 ring-primary" : "hover:scale-110"}`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={addEvent}>Add Event</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DAYS.map((day, i) => {
          const dayEvents = eventsForDay(day);
          const isToday = day === today;
          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`border-border/50 shadow-sm ${isToday ? "ring-2 ring-primary" : ""}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className={`w-4 h-4 ${isToday ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={isToday ? "text-primary font-bold" : ""}>{day}</span>
                      {isToday && <Badge className="text-xs h-4 px-1.5 bg-primary">Today</Badge>}
                    </div>
                    <span className="text-xs font-normal text-muted-foreground">{dayEvents.length} events</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 min-h-[80px]">
                  <AnimatePresence>
                    {dayEvents.length === 0 ? (
                      <p className="text-xs text-muted-foreground/50 text-center py-4">No events</p>
                    ) : (
                      dayEvents.map((event) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center gap-2 group"
                        >
                          <div className={`w-1 h-10 rounded-full ${event.colour} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{event.title}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {event.startTime} – {event.endTime}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
