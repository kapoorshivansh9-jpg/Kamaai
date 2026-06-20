"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { useUI } from "@/lib/ui-context";
import { useT } from "@/lib/i18n";

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
function EarnIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.4 : 1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7.5V6.5A1.5 1.5 0 0 0 17.5 5H5.5A2.5 2.5 0 0 0 3 7.5v9A2.5 2.5 0 0 0 5.5 19h12a1.5 1.5 0 0 0 1.5-1.5v-1"/>
      <path d="M16 11.5h4v3h-4a1.5 1.5 0 0 1 0-3z"/>
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
  { href: "/",       key: "nav.home"   as const, Icon: HomeIcon   },
  { href: "/shifts", key: "nav.shifts" as const, Icon: ShiftIcon  },
  { href: "/earnings", key: "nav.earn" as const, Icon: EarnIcon   },
  { href: "/heat",   key: "nav.heat"   as const, Icon: HeatIcon   },
  { href: "/rights", key: "nav.rights" as const, Icon: RightsIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { openProfile } = useUI();
  const t = useT();

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
        gap: 1,
        width: "100%",
        maxWidth: 430,
      }}>
        {tabs.map(({ href, key, Icon }) => {
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
                {t(key)}
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
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".3px", lineHeight: 1 }}>{t("nav.profile")}</span>
        </button>
      </div>
    </div>
  );
}
