"use client";

import { useState } from "react";
import {
  Home,
  Search,
  Settings,
  Shield,
  Bot,
  PanelLeftClose,
  PanelLeft,
  RefreshCw,
  Flame,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useSearchStore } from "@/store/search-store";
import { usePrivacyStore } from "@/store/privacy-store";
import { useAIStore } from "@/store/ai-store";
import { useSettingsStore } from "@/store/settings-store";
import { ShabahLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { SessionIdBadge } from "./session-id";
import { useTranslation } from "@/hooks/use-translation";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const view = useSearchStore((s) => s.view);
  const setView = useSearchStore((s) => s.setView);
  const reset = useSearchStore((s) => s.reset);

  const newIdentity = usePrivacyStore((s) => s.newIdentity);
  const firewallActive = usePrivacyStore((s) => s.firewallActive);
  const blockedAttempts = usePrivacyStore((s) => s.blockedAttempts);
  const initialized = usePrivacyStore((s) => s.initialized);

  const toggleAI = useAIStore((s) => s.togglePanel);
  const aiOpen = useAIStore((s) => s.panelOpen);
  const adminMode = useSettingsStore((s) => s.adminMode);
  const { t } = useTranslation();

  const width = collapsed ? "w-14" : "w-52";

  const navItems = [
    { key: "home", label: t("nav.home"), icon: Home },
    { key: "results", label: t("nav.results"), icon: Search },
    { key: "settings", label: t("nav.settings"), icon: Settings },
    { key: "admin", label: t("nav.admin"), icon: Shield },
  ] as const;

  return (
    <aside
      className={`hidden md:flex sidebar-transition sticky top-0 h-dvh shrink-0 flex-col border-l border-border bg-sidebar text-sidebar-foreground ${width}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-sidebar-border h-12">
        <button
          onClick={() => { reset(); setView("home"); }}
          className="flex items-center gap-2 min-w-0 focus-ring rounded-lg"
          title={t("nav.homeTitle")}
        >
          {collapsed ? (
            <div className="w-7 h-7 relative shrink-0">
              <ShabahLogo size={28} />
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 relative shrink-0">
                <ShabahLogo size={28} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold leading-none">
                  <span className="text-primary">ش</span>بح
                </div>
                <div className="text-[8px] text-muted-foreground font-mono mt-0.5 dir-ltr">PRIVATE</div>
              </div>
            </div>
          )}
        </button>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <TooltipProvider delayDuration={200}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            if (item.key === "admin" && !adminMode) return null;
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setView(item.key as any)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors focus-ring ${
                      active
                        ? "bg-primary/15 text-primary font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    } ${collapsed ? "justify-center px-0" : ""}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="left">{item.label}</TooltipContent>}
              </Tooltip>
            );
          })}

          <div className="my-2 border-t border-sidebar-border/50" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => toggleAI()}
                className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors focus-ring ${
                  aiOpen
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Bot className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{t("nav.ai")}</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="left">{t("nav.ai")}</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={newIdentity}
                className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors focus-ring text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${collapsed ? "justify-center px-0" : ""}`}
              >
                <RefreshCw className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{t("nav.newIdentity")}</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="left">{t("nav.newIdentity")}</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border/50 p-2 space-y-1">
        <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] ${firewallActive ? "text-primary/80" : "text-amber-500"} ${collapsed ? "justify-center" : ""}`}>
          <Flame className="w-3 h-3" />
          {!collapsed && <span>{firewallActive ? t("footer.firewallActive") : t("footer.firewallDisabled")}</span>}
          {!collapsed && firewallActive && initialized && (
            <span className="mr-auto text-[9px] bg-primary/15 px-1 py-0.5 rounded-full">{blockedAttempts}</span>
          )}
        </div>
        {!collapsed && initialized && <SessionIdBadge compact />}
        <div className={`flex ${collapsed ? "justify-center" : "justify-end"}`}>
          <ThemeToggle />
        </div>
        {collapsed && (
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)} className="w-full h-7 text-muted-foreground hover:text-foreground">
            <PanelLeft className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </aside>
  );
}

export function MobileBottomBar() {
  const view = useSearchStore((s) => s.view);
  const setView = useSearchStore((s) => s.setView);
  const reset = useSearchStore((s) => s.reset);
  const toggleAI = useAIStore((s) => s.togglePanel);
  const aiOpen = useAIStore((s) => s.panelOpen);
  const adminMode = useSettingsStore((s) => s.adminMode);
  const { t } = useTranslation();

  const items = [
    { key: "home", label: t("nav.home"), icon: Home },
    { key: "settings", label: t("mobile.settings"), icon: Settings },
    ...(adminMode ? [{ key: "admin", label: t("mobile.admin"), icon: Shield }] : []),
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border/50 glass">
      <div className="flex items-center justify-around h-12">
        {items.map((it) => {
          const Icon = it.icon;
          const active = view === it.key;
          return (
            <button
              key={it.key}
              onClick={() => {
                if (it.key === "home") reset();
                setView(it.key as any);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span className="text-[9px]">{it.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => toggleAI()}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full ${aiOpen ? "text-primary" : "text-muted-foreground"}`}
        >
          <Bot className="w-4.5 h-4.5" />
          <span className="text-[9px]">AI</span>
        </button>
      </div>
    </nav>
  );
}
