# Setup: Database + "Sign in with Google"

The code is already built and ships **disabled** until you add keys — nothing
breaks while it's off. Follow these steps once to turn it on. No coding.

## Part 1 — Connect the Supabase database (~5 min)

1. Go to **https://supabase.com** → sign up (free, no credit card).
2. Click **New Project**. Give it a name and a database password (save it).
3. Wait ~2 min for it to provision.
4. Left sidebar → **Project Settings → API**. Copy two values:
   - **Project URL**  (looks like `https://abcd1234.supabase.co`)
   - **anon public** key  (a long string)
5. Open the file **`.env.local`** in the project and paste them:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-long-anon-key
   ```
6. In Supabase, open **SQL Editor → New query**, paste the **entire contents
   of `supabase-schema.sql`**, and click **Run**. This creates the `profiles`
   and `events` tables with the secure access rules.
7. Restart the dev server (`Ctrl+C`, then `npm run dev`).

✅ Done — names + emails now save to the database when someone signs up, and the
"Sign in with Google" button appears in the Profile sheet.

## Part 2 — Enable "Sign in with Google" (~10 min)

You need a Google OAuth credential, then paste it into Supabase.

### A. Create the Google credential
1. Go to **https://console.cloud.google.com** → create a project (or pick one).
2. **APIs & Services → OAuth consent screen** → choose **External** → fill the
   app name + your email → Save. (You can leave it in "Testing" mode.)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Application type: **Web application**.
5. Under **Authorized redirect URIs**, add the callback URL from Supabase:
   - In Supabase: **Authentication → Providers → Google** — copy the
     **Callback URL** shown there (looks like
     `https://abcd1234.supabase.co/auth/v1/callback`).
   - Paste it into Google's redirect URIs box.
6. Click **Create**. Copy the **Client ID** and **Client secret**.

### B. Tell Supabase about it
1. In Supabase: **Authentication → Providers → Google** → toggle **Enabled**.
2. Paste the **Client ID** and **Client secret** → **Save**.

### C. Allow your app's address
1. In Supabase: **Authentication → URL Configuration**.
2. Set **Site URL** to `http://localhost:3000` for local testing
   (and add your real domain later when you deploy).

✅ Done — open the app → Profile → **Sign in with Google**. After signing in,
the rider's Google name + email are saved to your `profiles` table
automatically.

## Notes
- Everything is optional: with no keys, the app runs fully from the phone's
  local storage and the Google button stays hidden.
- The anon key is safe to expose in the browser (that's its purpose). Your
  database is protected by the Row Level Security rules in `supabase-schema.sql`
  — the public app can only write, never read other people's data.
- When you deploy (e.g. Vercel), add the same two `NEXT_PUBLIC_…` env vars there,
  and add your live domain to both Google's redirect URIs and Supabase's Site URL.
