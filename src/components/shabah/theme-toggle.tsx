"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/settings-store";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const setSetting = useSettingsStore((s) => s.set);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setSetting("theme", next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      title={theme === "dark" ? "تبديل للوضع الفاتح" : "تبديل للوضع الداكن"}
      className="h-9 w-9 text-muted-foreground hover:text-primary"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
      <span className="sr-only">تبديل السمة</span>
    </Button>
  );
}
