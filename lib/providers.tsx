"use client";

import { ProfileProvider } from "./ridekamao-profile";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ProfileProvider>{children}</ProfileProvider>;
}
