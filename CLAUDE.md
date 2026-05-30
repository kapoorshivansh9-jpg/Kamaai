@AGENTS.md

# CLAUDE.md — Frontend Website Rules

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `npm run dev` (serves at `http://localhost:3000`)
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- **Always screenshot from localhost:** `http://localhost:3000`
- After screenshotting, read the PNG with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Output Defaults
- Next.js app with Tailwind CSS (already configured)
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color

---

# RideKamao — Claude Code Project Spec

## What this app is

RideKamao ("Ride and Earn") is a shift intelligence mobile app for gig workers in India — delivery riders and auto-rickshaw drivers in Delhi NCR. It solves three problems in one app:

1. **Shift Planner** — tells the worker the 3 best time windows to work today based on weather, local events (IPL matches, festivals), and historical surge data.
2. **Heat Safety Index** — a daily color-coded dashboard (GREEN / YELLOW / ORANGE / RED) combining AQI, temperature, humidity, and UV index. Shows a "projected fatigue hour" and maps the nearest Sattu distribution points.
3. **Know Your Rights** — a WhatsApp-style Hindi chatbot that answers gig worker legal questions, citing BOCW, Code on Social Security 2020, and platform contractor agreements.

Target user: Raju, 28, Noida delivery rider. Opens app between deliveries. 2G connection possible. Budget Android phone. Comfortable with Hindi and WhatsApp.

---

## Tech stack

```
Framework:      Expo SDK 54 (React Native) with TypeScript
Routing:        Expo Router (file-based, app/ directory)
Styling:        NativeWind v4 + Tailwind CSS
UI Components:  gluestack-ui v3 (unstyled + NativeWind)
State:          Zustand (lightweight, no Redux overhead)
Backend:        Supabase (PostgreSQL + Auth + Edge Functions)
AI chatbot:     Anthropic Claude API (claude-sonnet-4-20250514) + pgvector RAG
Weather:        OpenWeatherMap API (free tier)
AQI:            AQICN API (free tier)
Maps:           react-native-maps with OpenStreetMap tiles
Local storage:  expo-sqlite (earnings targets, chat history, offline cache)
Auth:           Phone OTP via Supabase Auth + Twilio
Push:           Expo Notifications
Analytics:      PostHog (privacy-first, self-hostable)
```

---

## Project structure

```
ridekamao/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx             # Home — today's shift summary + heat badge
│   │   ├── shift.tsx             # Shift Planner — 3 time window cards
│   │   ├── heat.tsx              # Heat Safety Index — full dashboard
│   │   ├── rights.tsx            # Know Your Rights — chat interface
│   │   └── profile.tsx           # Settings, language toggle, vehicle type
│   ├── onboarding/
│   │   ├── welcome.tsx
│   │   ├── vehicle.tsx           # Pick vehicle type
│   │   └── location.tsx          # Set home zone
│   └── _layout.tsx
├── components/
│   ├── ShiftCard.tsx             # Single time-window card
│   ├── HeatBadge.tsx             # GREEN/YELLOW/ORANGE/RED pill
│   ├── HeatGauge.tsx             # Animated arc gauge for composite score
│   ├── SattuMap.tsx              # OSM map tile with sattu pin markers
│   ├── ChatBubble.tsx            # Rights chatbot message bubble
│   ├── ChatInput.tsx             # Hindi-first text input with mic button
│   └── OfflineBanner.tsx         # "Last updated X min ago" stale-data bar
├── lib/
│   ├── weather.ts                # OpenWeatherMap + AQICN fetch + cache
│   ├── heatIndex.ts              # Composite score calculation
│   ├── shiftPlanner.ts           # Scoring algorithm for time windows
│   ├── chatbot.ts                # Claude API call + RAG retrieval
│   ├── supabase.ts               # Supabase client
│   └── i18n.ts                   # Hindi / English string map
├── store/
│   ├── userStore.ts              # Vehicle type, location, earnings target
│   └── weatherStore.ts           # Cached weather + AQI data
├── constants/
│   ├── colors.ts                 # Design token palette (see below)
│   └── strings.ts                # All UI copy in Hindi + English
├── scripts/
│   ├── seed-rights-kb.ts         # Ingest BOCW/CoSS PDFs into pgvector
│   └── seed-surge-data.ts        # Seed historical surge mock data
└── supabase/
    ├── migrations/
    └── functions/
        ├── shift-recommendations/ # Edge Function: scoring + surge lookup
        └── rights-chat/           # Edge Function: RAG + Claude API call
```

---

## Design system

### Philosophy
1. **Glanceable first** — the worker opens this for 5 seconds between orders. The day's most important number must be visible without scrolling.
2. **Outdoor-optimised** — minimum 48×48px tap targets. High contrast. Large type for key data.
3. **Hindi-first** — all strings in `constants/strings.ts` with `hi` as default. Use `Noto Sans Devanagari` for Hindi, `Inter` for English.
4. **Offline-capable** — always show last-cached data with a stale timestamp.
5. **Worker dignity** — no streaks, no guilt. Data is context, not pressure.

### Colour tokens

```typescript
export const colors = {
  canvas:        '#0A1628',
  surface:       '#122035',
  surfaceAlt:    '#1A2E48',
  blue:          '#4F9CF9',
  gold:          '#F5C542',
  safe:          '#22C55E',
  caution:       '#F59E0B',
  warning:       '#F97316',
  danger:        '#EF4444',
  textPrimary:   '#F0F4F8',
  textSecondary: '#94A3B8',
  textMuted:     '#4A5568',
  border:        'rgba(255,255,255,0.08)',
  borderMid:     'rgba(255,255,255,0.15)',
}
```

### Typography
```
Display numbers  → 32px / 700
Screen title     → 22px / 600
Card title       → 17px / 600
Body             → 14px / 400
Caption          → 12px / 500 uppercase, letter-spacing 0.06em
```

---

## Privacy (NON-NEGOTIABLE)
- No raw GPS coordinates stored or logged.
- Earnings data stays on device (SQLite only).
- Rights chat queries sent to Claude API with no user identifier.
- PostHog: anonymous IDs only.

---

## Do not do
- No social features, payments, loans, or insurance.
- No `localStorage` or `AsyncStorage` for sensitive data.
- No GPS to any backend.
- No gamification: no streaks, no badges.
