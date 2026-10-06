// Daily keep-alive for the Supabase database.
// Supabase pauses free-tier projects after about a week with no requests, and a
// paused database silently breaks profile saves, analytics, votes and the
// crowdsourced amenities. Vercel Cron calls this once a day (see vercel.json);
// it does one tiny public read so the project always counts as active.
// It reads nothing private (water_points is already public) and writes nothing.

const TTL = 60 * 60 * 1000; // answer repeat calls from memory, so this can't be used to hammer the DB
let last: { at: number; ok: boolean } | null = null;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !url.startsWith("http")) return Response.json({ ok: false, reason: "not-configured" });
  if (last && Date.now() - last.at < TTL) return Response.json({ ok: last.ok, cached: true });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  let ok = false;
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/water_points?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: ctrl.signal,
      cache: "no-store",
    });
    ok = r.ok;
  } catch {
    ok = false;
  } finally {
    clearTimeout(timer);
  }
  last = { at: Date.now(), ok };
  // A failing ping should show up as a failed cron run in the Vercel dashboard.
  return Response.json({ ok }, { status: ok ? 200 : 503 });
}
