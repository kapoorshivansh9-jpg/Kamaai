"use client";

// Google sign-in via Supabase Auth. No-ops gracefully when Supabase isn't
// configured (the button simply doesn't render). The OAuth round-trip sends
// the user to Google and back to the app origin; Supabase persists the
// session, so the user stays signed in across reloads.

import { useEffect, useState, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase-browser";

export interface AuthUser {
  email: string;
  name: string;
}

function toUser(session: Session | null): AuthUser | null {
  const u = session?.user;
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as { full_name?: string; name?: string };
  return {
    email: u.email ?? "",
    name: meta.full_name ?? meta.name ?? (u.email ? u.email.split("@")[0] : ""),
  };
}

export function useGoogleAuth() {
  const supabase = getSupabase();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      setUser(toUser(data.session));
      if (sessionError) setError(sessionError.message);
      setReady(true);
    }).catch(() => { if (active) { setError("Could not check sign-in. Try again."); setReady(true); } });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toUser(session));
    });
    // Surface an OAuth error that came back in the redirect URL (e.g. the
    // Google provider isn't enabled, or the redirect URL isn't allow-listed).
    if (typeof window !== "undefined") {
      const query = new URLSearchParams(window.location.search);
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const errDesc = query.get("error_description") || fragment.get("error_description") || query.get("error") || fragment.get("error");
      if (errDesc) setError(errDesc);
    }
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(async (returnPath?: string) => {
    if (!supabase) return;
    setError(null);
    const redirectTo = returnPath ? window.location.origin + returnPath : window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) setError(error.message);
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  return { configured: !!supabase, ready, user, signIn, signOut, error };
}
