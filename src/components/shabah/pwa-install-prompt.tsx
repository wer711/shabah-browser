"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Ghost, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "shabah-pwa-dismissed";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if previously dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed === "true") return;

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Hide when installed
  useEffect(() => {
    const handler = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "true");
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-auto z-50">
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/90 backdrop-blur-md px-4 py-3 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
          <Ghost className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground whitespace-nowrap">
          ثبّت شبح على جهازك
        </p>
        <Button
          size="sm"
          onClick={handleInstall}
          className="shrink-0"
        >
          تثبيت
        </Button>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
