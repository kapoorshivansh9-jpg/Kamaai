"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { useUI } from "@/lib/ui-context";
import { cn } from "@/lib/utils";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5"/>
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1V9.5"/>
      <path d="M9.5 21v-6h5v6"/>
    </svg>
  );
}

function ShiftIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <polyline points="12 7 12 12 15.5 14"/>
    </svg>
  );
}

function HeatIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.2"/>
      <line x1="12" y1="2.5" x2="12" y2="5"/>
      <line x1="12" y1="19" x2="12" y2="21.5"/>
      <line x1="2.5" y1="12" x2="5" y2="12"/>
      <line x1="19" y1="12" x2="21.5" y2="12"/>
      <line x1="5.4" y1="5.4" x2="7.1" y2="7.1"/>
      <line x1="16.9" y1="16.9" x2="18.6" y2="18.6"/>
      <line x1="18.6" y1="5.4" x2="16.9" y2="7.1"/>
      <line x1="7.1" y1="16.9" x2="5.4" y2="18.6"/>
    </svg>
  );
}

function RightsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-3.5 7-9V6l-7-3-7 3v6c0 5.5 7 9 7 9z"/>
    </svg>
  );
}

const tabs = [
  { href: "/",       label: "Home",   Icon: HomeIcon   },
  { href: "/shifts", label: "Shifts", Icon: ShiftIcon  },
  { href: "/heat",   label: "Heat",   Icon: HeatIcon   },
  { href: "/rights", label: "Rights", Icon: RightsIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { openProfile } = useUI();

  if (pathname === "/onboarding") return null;

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--rk-line)",
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        boxShadow: "0 -4px 24px -8px rgba(10,24,18,.14)",
        height: 64,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "8px 4px",
              color: active ? "var(--rk-green)" : "var(--rk-faint)",
              textDecoration: "none",
              position: "relative",
              transition: "color .18s",
            }}
          >
            {active && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 28,
                  height: 3,
                  borderRadius: "0 0 3px 3px",
                  background: "var(--rk-green)",
                }}
              />
            )}
            <div
              style={{
                padding: "3px 14px",
                borderRadius: 20,
                background: active ? "var(--rk-green-50)" : "transparent",
                transition: "background .18s",
              }}
            >
              <Icon active={active} />
            </div>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: active ? 700 : 500,
                letterSpacing: ".2px",
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}

      {/* Profile button */}
      <button
        onClick={openProfile}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          padding: "8px 4px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--rk-faint)",
          transition: "color .18s",
        }}
      >
        <div style={{ padding: "3px 14px", borderRadius: 20 }}>
          <User size={22} strokeWidth={1.8} />
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: ".2px" }}>Profile</span>
      </button>
    </div>
  );
}
