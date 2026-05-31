# RideKamao — Shift Intelligence

Smart shift plans for Delhi NCR gig workers. Beat the heat, earn more, know your rights.

## Getting started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Setup

Copy `.env.local` and fill in your keys:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run `supabase-schema.sql` in your Supabase SQL editor to create the `profiles` and `events` tables.

## Deploy

Connect the GitHub repo to [Vercel](https://vercel.com), add the env vars, and deploy.
