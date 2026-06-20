"use client";

// Growth actions: share the app on WhatsApp, and (where the browser supports
// it) a one-tap "Install app" / Add-to-Home-Screen button.

import { useEffect, useState } from "react";
import { Share2, Download } from "lucide-react";
import { useT } from "@/lib/i18n";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

const G = { green700: "#045234", green: "#0A9060", surface: "#FFFFFF" };

export function SpreadActions() {
  const t = useT();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault(); // stop Chrome's default mini-infobar; we show our own
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const share = () => {
    const text = `${t("share.msg")} ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    setDeferred(null);
  };

  return (
    <div style={{ padding: "16px 18px 0" }}>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={share} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 14, background: "#25D366", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13.5, boxShadow: "0 8px 18px -8px rgba(37,211,102,.6)" }}>
          <Share2 size={17} /> {t("home.share")}
        </button>
        {deferred && (
          <button onClick={install} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 14, background: G.surface, color: G.green700, border: `1.5px solid ${G.green}`, cursor: "pointer", fontWeight: 700, fontSize: 13.5 }}>
            <Download size={17} /> {t("home.install")}
          </button>
        )}
      </div>
      {deferred && (
        <p style={{ margin: "8px 2px 0", fontSize: 11, color: "#7A9A8A", textAlign: "center" }}>{t("home.installHint")}</p>
      )}
    </div>
  );
}
