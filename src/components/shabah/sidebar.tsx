"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X,
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

/* ────────────────────────────────────────────
   Shared sidebar navigation items
   ──────────────────────────────────────────── */
function useNavItems() {
  const adminMode = useSettingsStore((s) => s.adminMode);
  const { t } = useTranslation();

  const items = [
    { key: "home", label: t("nav.home"), icon: Home },
    { key: "results", label: t("nav.results"), icon: Search },
    { key: "settings", label: t("nav.settings"), icon: Settings },
    ...(adminMode ? [{ key: "admin", label: t("nav.admin"), icon: Shield }] : []),
  ] as const;

  return items;
}

/* ────────────────────────────────────────────
   Desktop Sidebar  (md+)
   ──────────────────────────────────────────── */
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
  const { t } = useTranslation();
  const navItems = useNavItems();

  const width = collapsed ? "w-16" : "w-56";

  return (
    <aside
      className={`hidden md:flex sidebar-transition sticky top-0 h-screen shrink-0 flex-col border-l border-border bg-sidebar text-sidebar-foreground ${width}`}
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
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setView(item.key as never)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-ring ${active ? "bg-primary/15 text-primary font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"} ${collapsed ? "justify-center px-0" : ""}`}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="left">{item.label}</TooltipContent>}
              </Tooltip>
            );
          })}

          <div className="my-2 border-t border-sidebar-border" />

          {/* AI */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => toggleAI()}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-ring ${aiOpen ? "bg-primary/15 text-primary font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"} ${collapsed ? "justify-center px-0" : ""}`}
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

          <div className="mx-2 my-1 border-t border-sidebar-border/50" />

          {/* New identity */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={newIdentity}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-ring text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${collapsed ? "justify-center px-0" : ""}`}
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

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${firewallActive ? "text-primary" : "text-amber-500"} ${collapsed ? "justify-center" : ""}`}
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
        {!collapsed && initialized && <SessionIdBadge compact />}
        <div className={`flex ${collapsed ? "justify-center" : "justify-end"}`}>
          <ThemeToggle />
        </div>
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

/* ────────────────────────────────────────────
   Mobile Header Bar  (< md)
   ──────────────────────────────────────────── */
export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const setView = useSearchStore((s) => s.setView);
  const reset = useSearchStore((s) => s.reset);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Top bar */}
      <header className="md:hidden flex items-center justify-between h-12 px-3 border-b border-border bg-background/80 backdrop-blur-md">
        <button
          onClick={() => {
            reset();
            setView("home");
          }}
          className="flex items-center gap-2 focus-ring rounded-lg"
        >
          <div className="w-7 h-7 relative shrink-0">
            <ShabahLogo size={28} />
          </div>
          <span className="text-sm font-bold">
            <span className="text-primary">ش</span>بح
          </span>
        </button>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors focus-ring"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} bg-black/50 backdrop-blur-sm`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer — slides from the left (same side as the ☰ button) */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-3 border-b border-sidebar-border h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative shrink-0">
              <ShabahLogo size={32} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold leading-none">
                <span className="text-primary">ش</span>بح
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Drawer nav */}
        <DrawerNavItems closeDrawer={() => setOpen(false)} />
      </div>
    </>
  );
}

/* ────────────────────────────────────────────
   Drawer Navigation (shared with mobile)
   ──────────────────────────────────────────── */
function DrawerNavItems({ closeDrawer }: { closeDrawer: () => void }) {
  const view = useSearchStore((s) => s.view);
  const setView = useSearchStore((s) => s.setView);
  const reset = useSearchStore((s) => s.reset);
  const newIdentity = usePrivacyStore((s) => s.newIdentity);
  const firewallActive = usePrivacyStore((s) => s.firewallActive);
  const blockedAttempts = usePrivacyStore((s) => s.blockedAttempts);
  const initialized = usePrivacyStore((s) => s.initialized);
  const toggleAI = useAIStore((s) => s.togglePanel);
  const aiOpen = useAIStore((s) => s.panelOpen);
  const { t } = useTranslation();
  const navItems = useNavItems();

  const handleNav = (key: string) => {
    if (key === "home") reset();
    setView(key as never);
    closeDrawer();
  };

  return (
    <>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-ring ${active ? "bg-primary/15 text-primary font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        <div className="my-2 border-t border-sidebar-border" />

        {/* AI */}
        <button
          onClick={() => {
            toggleAI();
            closeDrawer();
          }}
          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-ring ${aiOpen ? "bg-primary/15 text-primary font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
        >
          <Bot className="w-4.5 h-4.5 shrink-0" />
          <span className="flex-1 text-right truncate">{t("nav.ai")}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
            {t("nav.new")}
          </span>
        </button>

        <div className="mx-2 my-1 border-t border-sidebar-border/50" />

        {/* New identity */}
        <button
          onClick={() => {
            newIdentity();
            closeDrawer();
          }}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-ring text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <RefreshCw className="w-4.5 h-4.5 shrink-0" />
          <span className="truncate">{t("nav.newIdentity")}</span>
        </button>
      </nav>

      {/* Drawer footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${firewallActive ? "text-primary" : "text-amber-500"}`}
        >
          <Flame className="w-3 h-3" />
          <span className="flex-1">
            {firewallActive ? t("footer.firewallActive") : t("footer.firewallDisabled")}
          </span>
          {firewallActive && initialized && (
            <span className="text-[10px] bg-primary/15 px-1.5 py-0.5 rounded-full">
              {blockedAttempts}
            </span>
          )}
        </div>
        {initialized && <SessionIdBadge compact />}
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}
