"use client";

import { Copy, RefreshCw, KeyRound } from "lucide-react";
import { useState } from "react";
import { usePrivacyStore } from "@/store/privacy-store";
import { useSettingsStore } from "@/store/settings-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";

export function SessionIdBadge({ compact = false }: { compact?: boolean }) {
  const sessionId = usePrivacyStore((s) => s.sessionId);
  const newIdentity = usePrivacyStore((s) => s.newIdentity);
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const copy = () => {
    navigator.clipboard?.writeText(sessionId);
    setCopied(true);
    toast.success(t("session.copied"));
    setTimeout(() => setCopied(false), 1500);
  };

  if (compact) {
    return (
      <button
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-2.5 py-1 text-[10px] font-mono text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
        title={t("session.compactTitle")}
      >
        <KeyRound className="w-3 h-3" />
        <span className="dir-ltr">{sessionId}</span>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center gap-2 mb-2">
        <KeyRound className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">{t("session.title")}</span>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 dir-ltr rounded-lg bg-background/60 border border-border px-3 py-2 text-sm text-primary font-mono tracking-wider">
          {sessionId}
        </code>
        <Button
          size="icon"
          variant="outline"
          onClick={copy}
          title={t("session.copy")}
          className="h-9 w-9"
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={newIdentity}
          title={t("session.newIdentityTitle")}
          className="h-9 w-9"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
        {t("session.autoRotate")}
      </p>
    </div>
  );
}

// Hook to force-update on theme change so logo swaps correctly
export function useIsDark() {
  const theme = useSettingsStore((s) => s.theme);
  return theme === "dark";
}
