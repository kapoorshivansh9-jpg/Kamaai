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
  let status = 0; // HTTP status from Supabase; 0 = no answer (timeout / DNS / network)
  let error = ""; // error class only — messages can echo header values, so they are not returned
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/water_points?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: ctrl.signal,
      cache: "no-store",
    });
    ok = r.ok;
    status = r.status;
  } catch (e) {
    ok = false;
    error = e instanceof Error ? e.name : "unknown";
  } finally {
    clearTimeout(timer);
  }
  // Only remember successes — a failure should be retried on the next call.
  last = ok ? { at: Date.now(), ok } : null;
  // The project ref is already public (it is in the browser bundle); showing it
  // here makes a wrong NEXT_PUBLIC_SUPABASE_URL obvious. A failing ping also
  // shows up as a failed cron run in the Vercel dashboard.
  let project = "";
  try { project = new URL(url).host.split(".")[0]; } catch { /* malformed URL */ }
  // A key pasted with a stray space or line break makes every request throw
  // before it is sent, so report the key's shape (never the key itself).
  const keyShape = key !== key.trim() ? "has-whitespace" : !/^[\w.\-]+$/.test(key) ? "bad-characters" : key.startsWith("eyJ") ? "legacy-jwt" : key.startsWith("sb_publishable_") ? "publishable" : "unknown-format";
  const urlShape = url !== url.trim() ? "has-whitespace" : "ok";
  return Response.json({ ok, status, error, project, keyShape, urlShape, keyLength: key.length }, { status: ok ? 200 : 503 });
}
