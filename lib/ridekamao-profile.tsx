"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { RideKamaoProfile } from "./ridekamao-data";

const STORAGE_KEY = "ridekamao-profile";

interface ProfileContextValue {
  profile: RideKamaoProfile | null;
  setProfile: (p: RideKamaoProfile) => void;
  clearProfile: () => void;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  setProfile: () => {},
  clearProfile: () => {},
  loading: true,
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<RideKamaoProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setProfileState(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
    setLoading(false);
  }, []);

  const setProfile = useCallback((p: RideKamaoProfile) => {
    setProfileState(p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }, []);

  const clearProfile = useCallback(() => {
    setProfileState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, clearProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
