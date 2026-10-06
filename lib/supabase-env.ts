// The Supabase URL and anon key, cleaned.
// Values pasted into a hosting dashboard often pick up a stray line break,
// space, quote or invisible character. One such character in a header makes
// every request throw before it is sent, which silently disables the whole
// database. So strip anything that cannot be part of a URL or a key.
export function supabaseEnv(): { url: string; key: string } | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/[^\x21-\x7E]/g, "")   // whitespace, line breaks, invisible characters
    .replace(/^["'`]+|["'`]+$/g, "") // wrapping quotes
    .replace(/\/+$/, "");
  // Both key formats (legacy JWT and sb_publishable_…) use only these characters.
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").replace(/[^A-Za-z0-9._-]/g, "");
  if (!url.startsWith("http") || !key) return null;
  return { url, key };
}
