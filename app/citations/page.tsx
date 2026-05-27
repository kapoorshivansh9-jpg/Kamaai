"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Copy, Sparkles, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const styles = [
  { value: "APA", label: "APA (7th ed.)", desc: "Psychology, Education, Social Sciences" },
  { value: "MLA", label: "MLA (9th ed.)", desc: "Literature, Humanities" },
  { value: "Chicago", label: "Chicago (17th ed.)", desc: "History, Arts" },
  { value: "Harvard", label: "Harvard", desc: "Business, Sciences (UK/AU)" },
];

interface CitationResult {
  citation: string;
  style: string;
  inText: string;
}

export default function CitationsPage() {
  const [input, setInput] = useState("");
  const [style, setStyle] = useState("APA");
  const [result, setResult] = useState<CitationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<CitationResult[]>([]);

  async function generateCitation() {
    if (!input.trim()) { toast.error("Please enter a URL or source details."); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate citation");
      setResult({ ...data, style });
      toast.success("Citation generated!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  }

  function saveCitation() {
    if (!result) return;
    setSaved((prev) => [result, ...prev]);
    toast.success("Citation saved!");
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold">Citation Formatter</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Paste a URL, DOI, or source details — Claude formats it instantly
        </p>
      </motion.div>

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Quote className="w-4 h-4 text-amber-500" />
                  Source Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>URL, DOI, or Source Information</Label>
                  <Textarea
                    placeholder={`Paste any of the following:\n• A webpage URL (https://...)\n• A DOI (10.xxxx/...)\n• Author, title, year, publisher details\n• A book title and author name`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={6}
                    className="resize-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Citation Style</Label>
                  <Select value={style} onValueChange={(v) => v && setStyle(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <div>
                            <span className="font-medium">{s.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">{s.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={generateCitation} disabled={loading || !input.trim()} className="w-full gap-2">
                  <Sparkles className="w-4 h-4" />
                  {loading ? "Generating..." : "Generate Citation"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-primary/30 shadow-sm bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Generated Citation
                      </div>
                      <Badge variant="secondary">{result.style}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reference List</p>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => copy(result.citation)}>
                          <Copy className="w-3 h-3 mr-1" /> Copy
                        </Button>
                      </div>
                      <p className="text-sm leading-relaxed bg-background rounded-lg p-3 border border-border/50 font-mono">
                        {result.citation}
                      </p>
                    </div>
                    {result.inText && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In-text Citation</p>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => copy(result.inText)}>
                            <Copy className="w-3 h-3 mr-1" /> Copy
                          </Button>
                        </div>
                        <p className="text-sm bg-background rounded-lg p-3 border border-border/50 font-mono">
                          {result.inText}
                        </p>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full" onClick={saveCitation}>
                      Save Citation
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="md:col-span-2">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-border/50 shadow-sm sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  Saved Citations
                  {saved.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">{saved.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence>
                  {saved.length === 0 ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground text-center py-8"
                    >
                      Your saved citations will appear here
                    </motion.p>
                  ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                      {saved.map((c, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="group relative bg-muted/40 rounded-lg p-3"
                        >
                          <Badge variant="outline" className="text-xs mb-1.5">{c.style}</Badge>
                          <p className="text-xs leading-relaxed font-mono text-foreground/80 line-clamp-3">{c.citation}</p>
                          <button
                            onClick={() => copy(c.citation)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
