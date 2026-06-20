// Know Your Rights — Claude-powered chatbot (server-side only).
// The ANTHROPIC_API_KEY never leaves the server. When the key is not
// configured (or the API errors), we return { fallback: true } and the
// client gracefully falls back to the built-in Q&A knowledge base.

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { RIGHTS_CONTENT, LANGUAGES } from "@/lib/ridekamao-data";

// Project spec pinned Sonnet (claude-sonnet-4-20250514, now deprecated) —
// claude-sonnet-4-6 is its current successor.
const MODEL = "claude-sonnet-4-6";

const BodySchema = z.object({
  question: z.string().trim().min(2).max(500),
  language: z.enum(["en", "hi", "pa", "bn", "ta", "mr"]).default("hi"),
});

// ── Stable system prompt (built once → cacheable prefix) ──────
function buildKnowledgeBase(): string {
  const parts: string[] = [];
  for (const [lang, content] of Object.entries(RIGHTS_CONTENT)) {
    for (const qa of content.questions) {
      parts.push(
        `[${lang}] Q: ${qa.q}\nA: ${qa.a}\nSources: ${qa.cites.join("; ")}`
      );
    }
  }
  return parts.join("\n\n");
}

const SYSTEM_PROMPT = `You are "RideKamao Saathi", a legal-rights companion for gig workers in Delhi NCR, India — delivery riders, auto-rickshaw, bike-taxi and cab drivers. You answer questions about their rights under Indian law in simple, plain language a worker with a basic phone can understand on a 5-second break.

RULES:
- Answer ONLY questions about gig-worker rights, labour law, platform policies, insurance, accidents, ID blocks, ratings, wages, e-Shram registration, grievances, and worker safety in India. For anything else (homework, coding, politics, medical advice, etc.) politely decline in one sentence and steer back to rights topics.
- Keep answers SHORT: 3-5 sentences max. No markdown, no bullet lists, no headings — plain conversational text, like a WhatsApp message.
- Ground answers in the knowledge base below when relevant. You may extend with well-established Indian law (Code on Social Security 2020, BOCW Act 1996, Motor Vehicles Act, Consumer Protection (E-Commerce) Rules 2020, Rajasthan Platform-Based Gig Workers Act 2023, Karnataka gig worker legislation).
- You are NOT a lawyer. For serious disputes, recommend the e-Shram helpdesk (14434) or the state gig worker board.
- Never invent specific section numbers you are not sure about.
- Never ask for or repeat personal data (names, phone numbers, IDs).

KNOWLEDGE BASE:
${buildKnowledgeBase()}

OUTPUT FORMAT: respond with JSON: {"answer": "<your answer in the requested language>", "cites": ["<1-3 short source names>"]}.`;

const OUTPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    answer: { type: "string" as const },
    cites: { type: "array" as const, items: { type: "string" as const } },
  },
  required: ["answer", "cites"],
  additionalProperties: false,
};

function hasApiKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !!key && key.startsWith("sk-ant-");
}

// ── Rate limiting (in-memory, per-IP fixed window) ────────────
// Protects the API key from abuse. This is per-instance; for multi-instance
// production, back it with a shared store (e.g. Upstash Redis).
const RATE_LIMIT = 20;        // max requests…
const WINDOW_MS = 60_000;     // …per minute, per IP
const hits = new Map<string, { count: number; reset: number }>();

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Returns seconds-to-wait if the caller is over the limit, else 0. */
function rateLimit(request: Request): number {
  const ip = clientIp(request);
  const now = Date.now();
  // Opportunistic cleanup so the map can't grow without bound.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
  }
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return 0;
  }
  entry.count++;
  return entry.count > RATE_LIMIT ? Math.ceil((entry.reset - now) / 1000) : 0;
}

export async function POST(request: Request) {
  const retryAfter = rateLimit(request);
  if (retryAfter > 0) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!hasApiKey()) {
    // No key configured — client falls back to the local knowledge base.
    return Response.json({ fallback: true });
  }

  const langLabel =
    LANGUAGES.find((l) => l.id === body.language)?.label ?? "Hindi";

  try {
    const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      // Stable prefix cached across requests; the per-user question varies.
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: {
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      messages: [
        {
          role: "user",
          // No user identifier is ever sent — privacy rule of this app.
          content: `Language to answer in: ${langLabel}\nQuestion: ${body.question}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return Response.json({ fallback: true });
    }

    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) return Response.json({ fallback: true });

    const parsed = JSON.parse(text) as { answer: string; cites: string[] };
    return Response.json({
      answer: parsed.answer,
      cites: (parsed.cites ?? []).slice(0, 3),
    });
  } catch (error) {
    // Rate limits, overload, network — degrade gracefully, never 500 the UI.
    if (error instanceof Anthropic.APIError) {
      console.error(`rights-chat: Claude API error ${error.status}`);
    } else {
      console.error("rights-chat: unexpected error");
    }
    return Response.json({ fallback: true });
  }
}
