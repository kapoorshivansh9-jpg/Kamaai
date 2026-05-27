"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, RotateCcw, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  topics: string[];
}

export default function NotesPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFull, setShowFull] = useState(false);

  async function summarise() {
    if (!text.trim() || text.trim().length < 50) {
      toast.error("Please paste at least 50 characters of notes to summarise.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to summarise");
      setResult(data);
      toast.success("Summary ready!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(content: string) {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold">AI Notes Summariser</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Paste your lecture notes or text — Claude AI will summarise and extract key points
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-500" />
                Your Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Textarea
                placeholder="Paste your lecture notes, textbook excerpts, or any study material here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={14}
                className="resize-none text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{text.length} characters</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setText(""); setResult(null); }}
                    disabled={!text && !result}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Clear
                  </Button>
                  <Button
                    onClick={summarise}
                    disabled={loading || !text.trim()}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {loading ? "Summarising..." : "Summarise"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                  >
                    <div className="relative w-10 h-10 mb-4">
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <p className="text-sm">Claude is reading your notes...</p>
                  </motion.div>
                )}

                {!loading && !result && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                  >
                    <Sparkles className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm text-center">Your AI-powered summary will appear here</p>
                    <p className="text-xs text-center mt-1 opacity-60">Requires an Anthropic API key in .env.local</p>
                  </motion.div>
                )}

                {!loading && result && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    {result.topics.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Topics</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.topics.map((t, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Summary</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => copyToClipboard(result.summary)}
                        >
                          <Copy className="w-3 h-3 mr-1" /> Copy
                        </Button>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/80">
                        {showFull ? result.summary : result.summary.slice(0, 300) + (result.summary.length > 300 ? "..." : "")}
                      </p>
                      {result.summary.length > 300 && (
                        <button
                          onClick={() => setShowFull(!showFull)}
                          className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"
                        >
                          {showFull ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                        </button>
                      )}
                    </div>

                    {result.keyPoints.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Points</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => copyToClipboard(result.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n"))}
                          >
                            <Copy className="w-3 h-3 mr-1" /> Copy
                          </Button>
                        </div>
                        <ul className="space-y-2">
                          {result.keyPoints.map((point, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-foreground/80 leading-relaxed">{point}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
