"use client";

import { usePrivacyStore } from "@/store/privacy-store";
import { useSearchStore } from "@/store/search-store";
import { useTranslation } from "@/hooks/use-translation";

export function Footer() {
  const { connected, firewallActive, initialized } = usePrivacyStore();
  const view = useSearchStore((s) => s.view);
  const reset = useSearchStore((s) => s.reset);
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-border/50 bg-background/40">
      <div className="flex items-center justify-center gap-3 px-4 py-2 text-[10px] text-muted-foreground sm:pb-3">
        <span className="inline-flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${connected && initialized ? "bg-primary" : "bg-amber-500"}`} />
          {connected && initialized ? t("site.networkActive") : t("site.disconnected")}
        </span>
        <span className="text-border">|</span>
        <span className={`inline-flex items-center gap-1 ${firewallActive ? "text-primary" : "text-amber-500"}`}>
          {firewallActive ? t("site.firewallActive") : t("site.firewallDisabled")}
        </span>
        <span className="text-border">|</span>
        <span>شبح v1.0</span>
      </div>
    </footer>
  );
}
