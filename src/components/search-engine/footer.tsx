"use client";

import { ShieldCheck } from "lucide-react";
import { useSearchStore } from "@/store/search-store";
import { useTranslation } from "@/hooks/use-translation";

export function Footer() {
  const view = useSearchStore((s) => s.view);
  const reset = useSearchStore((s) => s.reset);
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-border bg-background/60 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-primary" />
          <span>شبح v1.0</span>
        </span>
        {view !== "home" && (
          <button onClick={reset} className="hover:text-primary transition-colors">
            {t("site.homePage")}
          </button>
        )}
      </div>
    </footer>
  );
}
