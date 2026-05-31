"use client";

import { ProfileProvider } from "./ridekamao-profile";
import { UIProvider } from "./ui-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <UIProvider>{children}</UIProvider>
    </ProfileProvider>
  );
}
