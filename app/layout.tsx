import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/lib/providers";
import { BottomNav } from "@/components/bottom-nav";
import { ProfileSheet } from "@/components/profile-sheet";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RideKamao — Shift Intelligence",
  description: "Smart shift plans for Delhi NCR gig workers. Beat the heat, earn more, know your rights.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "RideKamao" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom stays enabled — important for accessibility on small screens.
  themeColor: "#0C9267",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${geistMono.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full antialiased" style={{ background: "var(--rk-bg)" }}>
        <Providers>
          {/* Centred app shell */}
          <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", position: "relative", display: "flex", flexDirection: "column" }}>
            {/* Page content — padded above bottom nav */}
            <main className="flex-1 flex flex-col min-h-0 overflow-y-auto pb-[64px]">
              {children}
            </main>
            <BottomNav />
          </div>
          <ProfileSheet />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
