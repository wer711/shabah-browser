"use client";

import { RefreshCw, Shield, Lock, Globe, Zap, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePrivacyStore } from "@/store/privacy-store";
import { useTranslation } from "@/hooks/use-translation";

function flagEmoji(code: string) {
  if (!code || code.length !== 2) return "🏳";
  const cp = [...code.toUpperCase()].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...cp);
}

export function PrivacyPanel() {
  const {
    connected,
    encryption,
    relays,
    visibleIp,
    rotateCircuit,
    newIdentity,
    firewallActive,
    blockedAttempts,
    queriesCount,
    pagesProxied,
    bytesSaved,
    sessionId,
  } = usePrivacyStore();
  const { t } = useTranslation();

  if (!connected) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2 text-amber-400">
          <Shield className="w-4 h-4" />
          <span className="font-semibold text-sm">{t("privacy.notConnected")}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t("privacy.notConnectedDesc")}
        </p>
      </div>
    );
  }

  const kbSaved = Math.max(0, Math.round(bytesSaved / 1024));

  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-2">
          <span className="relative flex w-2.5 h-2.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-60 pulse-ring" />
            <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-primary" />
          </span>
          <span className="text-sm font-semibold">{t("privacy.connected")}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={rotateCircuit}
            className="h-7 text-xs text-muted-foreground hover:text-primary px-2"
            title="تبديل مسار العُقد (دورة جديدة)"
          >
            <RefreshCw className="w-3 h-3" />
            {t("privacy.rotate")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={newIdentity}
            className="h-7 text-xs text-muted-foreground hover:text-primary px-2"
            title={t("session.newIdentityTitle")}
          >
            <RefreshCw className="w-3 h-3" />
            {t("privacy.identity")}
          </Button>
        </div>
      </div>

      {/* Circuit visualization with SVG path */}
      <div className="p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            {t("privacy.you")}
          </span>
          <div className="flex-1 mx-2 relative h-px">
            <div className="absolute inset-0 bg-gradient-to-l from-primary/40 via-primary/60 to-primary/40" />
          </div>
          <span className="flex items-center gap-1 text-primary">
            <Lock className="w-3.5 h-3.5" />
            {t("privacy.destination")}
          </span>
        </div>

        <ol className="space-y-2">
          {relays.map((r, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-lg bg-background/40 border border-border/60 px-3 py-2"
            >
              <span className="text-lg" title={r.country}>
                {flagEmoji(r.flag)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {r.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {r.country}
                  </span>
                </div>
                <code className="text-[11px] text-muted-foreground dir-ltr inline-block">
                  {r.ip} · {r.latencyMs}ms · {r.load}%
                </code>
              </div>
              <Zap className="w-3 h-3 text-primary/70 shrink-0" />
            </li>
          ))}
        </ol>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-background/40 border border-border/60 px-2 py-2">
            <div className="text-base font-bold text-primary tabular-nums">
              {queriesCount}
            </div>
            <div className="text-[10px] text-muted-foreground">{t("privacy.anonSearches")}</div>
          </div>
          <div className="rounded-lg bg-background/40 border border-border/60 px-2 py-2">
            <div className="text-base font-bold text-primary tabular-nums">
              {pagesProxied}
            </div>
            <div className="text-[10px] text-muted-foreground">{t("privacy.proxiedPages")}</div>
          </div>
          <div className="rounded-lg bg-background/40 border border-border/60 px-2 py-2">
            <div className="text-base font-bold text-primary tabular-nums">
              {kbSaved}KB
            </div>
            <div className="text-[10px] text-muted-foreground">{t("privacy.trackersBlocked")}</div>
          </div>
        </div>
      </div>

      {/* Firewall mini-status */}
      <div className="px-4 pb-3">
        <div className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
          firewallActive
            ? "border-primary/30 bg-primary/5 text-primary"
            : "border-amber-500/30 bg-amber-500/5 text-amber-400"
        }`}>
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            {firewallActive ? t("footer.firewallActive") : t("footer.firewallDisabled")}
          </span>
          {firewallActive && (
            <span className="text-[10px] bg-primary/15 px-1.5 py-0.5 rounded-full">
              {blockedAttempts} {t("privacy.interceptAttempts")}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          {encryption}
        </span>
        <Badge
          variant="outline"
          className="border-primary/40 text-primary text-[10px] font-mono"
          title={`مُعرّف الجلسة: ${sessionId}`}
        >
          {sessionId}
        </Badge>
      </div>
    </div>
  );
}
