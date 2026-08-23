"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { useTheme } from "next-themes";

/**
 * Reactive sync between Zustand settings store and DOM/next-themes.
 * Place once inside AppShell so settings changes take effect immediately.
 */
export function SettingsSync() {
  const language = useSettingsStore((s) => s.language);
  const theme = useSettingsStore((s) => s.theme);
  const { setTheme, resolvedTheme } = useTheme();

  // Sync language → HTML lang + dir
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", language);
    html.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
  }, [language]);

  // Sync theme from store → next-themes on mount & change
  useEffect(() => {
    if (theme && resolvedTheme !== theme) {
      setTheme(theme);
    }
  }, [theme, setTheme, resolvedTheme]);

  return null;
}
