"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/settings-store";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
   );
}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const setSetting = useSettingsStore((s) => s.set);
  const mounted = useIsMounted();

  const currentTheme = resolvedTheme || theme || "dark";

  const toggle = () => {
    const next = currentTheme === "dark" ? "light" : "dark";
    setTheme(next);
    setSetting("theme", next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      title={mounted && currentTheme === "dark" ? "تبديل للوضع الفاتح" : "تبديل للوضع الداكن"}
      className="h-9 w-9 text-muted-foreground hover:text-primary"
    >
      {mounted && currentTheme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
      <span className="sr-only">تبديل السمة</span>
    </Button>
  );
}
