"use client";

import { ShieldCheck, EyeOff, Lock, Flame } from "lucide-react";
import { usePrivacyStore } from "@/store/privacy-store";
import { useSearchStore } from "@/store/search-store";
import { useTranslation } from "@/hooks/use-translation";

export function SiteFooter() {
  const { connected, firewallActive, encryption, sessionId } = usePrivacyStore();
  const reset = useSearchStore((s) => s.reset);
  const view = useSearchStore((s) => s.view);
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-border bg-background/60 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap justify-center text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex w-2 h-2">
                <span
                  className={`absolute inline-flex w-full h-full rounded-full ${
                    connected ? "bg-primary pulse-ring" : "bg-amber-500"
                  } opacity-60`}
                />
                <span
                  className={`relative inline-flex w-2 h-2 rounded-full ${
                    connected ? "bg-primary" : "bg-amber-500"
                  }`}
                />
              </span>
              {connected ? t("site.networkActive") : t("site.disconnected")}
            </span>
            <span className="inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {encryption}
            </span>
            <span className="inline-flex items-center gap-1">
              <Flame className={`w-3 h-3 ${firewallActive ? "text-primary" : "text-amber-500"}`} />
              {firewallActive ? t("site.firewallActive") : t("site.firewallDisabled")}
            </span>
            <span className="inline-flex items-center gap-1">
              <EyeOff className="w-3 h-3" />
              {t("site.zeroLogs")}
            </span>
            <code className="text-muted-foreground/70 dir-ltr text-[10px]">{sessionId}</code>
          </div>

          <div className="flex items-center gap-3 text-muted-foreground">
            {view !== "home" && (
              <button
                onClick={reset}
                className="hover:text-primary transition-colors"
              >
                {t("site.homePage")}
              </button>
            )}
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-primary" />
              شبح v1.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
