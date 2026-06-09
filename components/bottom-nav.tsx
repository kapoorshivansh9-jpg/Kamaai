"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { useUI } from "@/lib/ui-context";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.4 : 1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5"/>
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1V9.5"/>
      <path d="M9.5 21v-6h5v6"/>
    </svg>
  );
}
function ShiftIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.4 : 1.9} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <polyline points="12 7 12 12 15.5 14"/>
    </svg>
  );
}
function HeatIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.4 : 1.9} strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.4 : 1.9} strokeLinecap="round" strokeLinejoin="round">
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
    <div style={{
      position: "sticky",
      bottom: 12,
      zIndex: 40,
      display: "flex",
      justifyContent: "center",
      padding: "0 16px",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px)",
        borderRadius: 32,
        boxShadow: "0 2px 8px rgba(5,22,14,.08), 0 20px 48px -8px rgba(5,22,14,.22), inset 0 1px 0 rgba(255,255,255,.9)",
        border: "1px solid rgba(189,216,200,.6)",
        padding: "5px 6px",
        gap: 2,
        width: "100%",
        maxWidth: 380,
      }}>
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                padding: "8px 4px",
                borderRadius: 26,
                background: active ? "var(--rk-green)" : "transparent",
                color: active ? "#fff" : "var(--rk-faint)",
                textDecoration: "none",
                transition: "background .2s, color .2s",
                minWidth: 0,
              }}
            >
              <Icon active={active} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 600, letterSpacing: ".3px", lineHeight: 1 }}>
                {label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={openProfile}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            padding: "8px 4px",
            borderRadius: 26,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--rk-faint)",
          }}
        >
          <User size={20} strokeWidth={1.9} />
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".3px", lineHeight: 1 }}>Profile</span>
        </button>
      </div>
    </div>
  );
}
