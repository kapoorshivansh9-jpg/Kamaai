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

Run `supabase-schema.sql` in your Supabase SQL editor to create the `profiles` and `events` tables. Then run `water-points-schema.sql`, `amenities-migration.sql`, `spot-feedback-schema.sql` and `profile-save-function.sql`.

Run `places-schema.sql` as well: it creates the places tables behind the Shift Planner and a tile queue that keeps them loaded from OpenStreetMap (schedule the tick with the `cron.schedule` line at the bottom of that file). `.github/workflows/import-overture.yml` adds Overture Maps places on top; it needs the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` repository secrets.

`vercel.json` schedules a daily call to `/api/keepalive`, which does one small read so the free-tier Supabase project is not paused for inactivity.

## Deploy

Connect the GitHub repo to [Vercel](https://vercel.com), add the env vars, and deploy.
