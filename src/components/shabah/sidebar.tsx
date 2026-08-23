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

  const width = collapsed ? "w-16" : "w-56";

  const navItems = [
    { key: "home", label: t("nav.home"), icon: Home },
    { key: "results", label: t("nav.results"), icon: Search },
    { key: "settings", label: t("nav.settings"), icon: Settings },
    { key: "admin", label: t("nav.admin"), icon: Shield },
  ] as const;

  return (
    <aside
      className={`hidden sm:flex sidebar-transition sticky top-0 h-screen shrink-0 flex-col border-l border-border bg-sidebar text-sidebar-foreground ${width}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-sidebar-border h-14">
        <button
          onClick={() => {
            reset();
            setView("home");
          }}
          className="flex items-center gap-2 min-w-0 focus-ring rounded-lg"
          title={t("nav.homeTitle")}
        >
          {collapsed ? (
            <div className="w-8 h-8 relative shrink-0">
              <ShabahLogo size={32} />
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 relative shrink-0">
                <ShabahLogo size={32} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold leading-none">
                  <span className="text-primary">ش</span>بح
                </div>
                <div className="text-[9px] text-muted-foreground font-mono mt-0.5 dir-ltr">
                  PRIVATE
                </div>
              </div>
            </div>
          )}
        </button>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title={t("nav.collapseSidebar")}
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        <TooltipProvider delayDuration={200}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            const adminHidden = item.key === "admin" && !adminMode;
            if (adminHidden) return null;
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setView(item.key as any)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-ring ${
                      active
                        ? "bg-primary/15 text-primary font-medium"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    } ${collapsed ? "justify-center px-0" : ""}`}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="left">{item.label}</TooltipContent>
                )}
              </Tooltip>
            );
          })}

          <div className="my-2 border-t border-sidebar-border" />

          {/* AI assistant */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => toggleAI()}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-ring ${
                  aiOpen
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Bot className="w-4.5 h-4.5 shrink-0" />
                {!collapsed && (
                  <span className="flex-1 text-right truncate">{t("nav.ai")}</span>
                )}
                {!collapsed && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                    {t("nav.new")}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="left">{t("nav.ai")}</TooltipContent>}
          </Tooltip>

          {/* Separator between AI and New Identity */}
          <div className="mx-2 my-1 border-t border-sidebar-border/50" />

          {/* New identity */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={newIdentity}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-ring text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                  collapsed ? "justify-center px-0" : ""
                }`}
              >
                <RefreshCw className="w-4.5 h-4.5 shrink-0" />
                {!collapsed && <span className="truncate">{t("nav.newIdentity")}</span>}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="left">{t("nav.newIdentity")}</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </nav>

      {/* Footer: firewall + session + theme */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        {/* Firewall status - compact */}
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${
            firewallActive
              ? "text-primary"
              : "text-amber-500"
          } ${collapsed ? "justify-center" : ""}`}
          title={
            firewallActive
              ? t("footer.firewallTitle", { count: blockedAttempts })
              : t("footer.firewallDisabledTitle")
          }
        >
          <Flame className="w-3 h-3" />
          {!collapsed && (
            <span className="flex-1">
              {firewallActive ? t("footer.firewallActive") : t("footer.firewallDisabled")}
            </span>
          )}
          {!collapsed && firewallActive && initialized && (
            <span className="text-[10px] bg-primary/15 px-1.5 py-0.5 rounded-full">
              {blockedAttempts}
            </span>
          )}
        </div>

        {/* Session id (compact) */}
        {!collapsed && initialized && <SessionIdBadge compact />}

        {/* Theme toggle */}
        <div className={`flex ${collapsed ? "justify-center" : "justify-end"}`}>
          <ThemeToggle />
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="w-full h-8 text-muted-foreground hover:text-foreground"
            title={t("nav.expandSidebar")}
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
        )}
      </div>
    </aside>
  );
}

// Mobile bottom bar version (visible on small screens)
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
    { key: "results", label: t("mobile.search"), icon: Search },
    { key: "settings", label: t("mobile.settings"), icon: Settings },
    ...(adminMode ? [{ key: "admin", label: t("mobile.admin"), icon: Shield }] : []),
  ] as const;

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border glass">
      <div className="flex items-center justify-around h-14">
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
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {it.label}
            </button>
          );
        })}
        <button
          onClick={() => toggleAI()}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] ${
            aiOpen ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Bot className="w-5 h-5" />
          AI
        </button>
      </div>
    </nav>
  );
}
