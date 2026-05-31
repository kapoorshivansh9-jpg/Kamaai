"use client";

import { createContext, useContext, useState } from "react";

interface UIContextValue {
  profileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
}

const UIContext = createContext<UIContextValue>({
  profileOpen: false,
  openProfile: () => {},
  closeProfile: () => {},
});

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <UIContext.Provider
      value={{
        profileOpen,
        openProfile: () => setProfileOpen(true),
        closeProfile: () => setProfileOpen(false),
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
