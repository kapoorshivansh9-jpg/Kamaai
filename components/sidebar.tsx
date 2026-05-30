"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Quote,
  LayoutDashboard,
  Flame,
  Shield,
  ChevronDown,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/lib/ridekamao-profile";
import { PROFESSIONS } from "@/lib/ridekamao-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Custom calendar/shift icon
function ShiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="17" rx="2.5"/>
      <line x1="3" y1="9.5" x2="21" y2="9.5"/>
      <line x1="8" y1="2.5" x2="8" y2="6.5"/>
      <line x1="16" y1="2.5" x2="16" y2="6.5"/>
      <path d="M7 14h3v3H7z" fill="currentColor" stroke="none"/>
      <path d="M14 14h3v3h-3z" stroke="none" fill="currentColor" opacity="0.4"/>
    </svg>
  );
}

const rideItems = [
  { href: "/shifts",  label: "Shifts",       Icon: ShiftIcon },
  { href: "/heat",    label: "Heat Safety",   Icon: Flame },
  { href: "/rights",  label: "Know Your Rights", Icon: Shield },
];

const studyItems = [
  { href: "/",            label: "Dashboard",   Icon: LayoutDashboard },
  { href: "/assignments", label: "Assignments", Icon: ClipboardList },
  { href: "/notes",       label: "AI Notes",    Icon: FileText },
  { href: "/schedule",    label: "Schedule",    Icon: CalendarDays },
  { href: "/citations",   label: "Citations",   Icon: Quote },
];

function NavSection({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { href: string; label: string; Icon: React.ElementType }[];
  pathname: string;
}) {
  return (
    <div className="px-3 py-2">
      <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/35">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map(({ href, label: itemLabel, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {itemLabel}
                {active && (
                  <motion.div
                    layoutId="sidebarActive"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/70"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ProfileDropdown() {
  const { profile, clearProfile } = useProfile();
  const router = useRouter();

  const profession = PROFESSIONS.find((p) => p.id === profile?.profession);
  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const handleReset = () => {
    clearProfile();
    router.push("/onboarding");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
          bg-sidebar-accent/60 hover:bg-sidebar-accent transition-colors
          text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full
            bg-primary text-primary-foreground text-xs font-bold shrink-0"
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
            {profile?.name || "Set up profile"}
          </p>
          <p className="text-[11px] text-sidebar-foreground/50 truncate mt-0.5">
            {profession ? `${profession.icon} ${profession.title.split(" ")[0]}` : "No profession set"}
          </p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground/40 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-52">
        <DropdownMenuLabel className="text-xs">
          {profile?.name ? `${profile.name}'s profile` : "No profile"}
        </DropdownMenuLabel>
        {profile && (
          <>
            <DropdownMenuItem className="text-xs gap-2">
              <User className="w-3.5 h-3.5" />
              <span>{profession?.title ?? "Rider"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2">
              <span className="text-base leading-none">{profession?.icon}</span>
              <span>Target ₹{profile.weeklyTarget.toLocaleString("en-IN")}/wk</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/onboarding")} className="text-xs gap-2">
          <Settings className="w-3.5 h-3.5" />
          {profile ? "Edit profile" : "Set up profile"}
        </DropdownMenuItem>
        {profile && (
          <DropdownMenuItem onClick={handleReset} variant="destructive" className="text-xs gap-2">
            <LogOut className="w-3.5 h-3.5" />
            Reset &amp; restart
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
          style={{ background: "linear-gradient(160deg,#13A878,#0B8C63)" }}
        >
          <span className="text-lg leading-none">🛵</span>
        </div>
        <div>
          <p className="font-bold text-base text-sidebar-foreground leading-none tracking-tight">
            Ride<span style={{ color: "#9BF0CE" }}>Kamao</span>
          </p>
          <p className="text-[11px] text-sidebar-foreground/40 mt-0.5">Delhi NCR · Shift Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <NavSection label="Ride" items={rideItems} pathname={pathname} />
        <div className="mx-4 my-1.5 h-px bg-sidebar-border/50" />
        <NavSection label="Study" items={studyItems} pathname={pathname} />
      </nav>

      {/* Profile */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <ProfileDropdown />
        <p className="text-[10px] text-sidebar-foreground/25 text-center mt-2.5">
          Powered by Claude AI
        </p>
      </div>
    </aside>
  );
}
