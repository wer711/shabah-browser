"use client";

import { useState } from "react";
import {
  ShieldOff,
  EyeOff,
  ExternalLink,
  Globe,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SearchResultItem } from "@/store/search-store";
import { useSearchStore } from "@/store/search-store";
import { usePrivacyStore } from "@/store/privacy-store";
import { useAIStore } from "@/store/ai-store";
import { PrivacyGrade } from "@/components/shabah/privacy-grade";
import { useTranslation } from "@/hooks/use-translation";

interface ResultCardProps {
  item: SearchResultItem;
  index: number;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function faviconFor(item: SearchResultItem) {
  if (item.favicon) return item.favicon;
  const host = getDomain(item.url);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
}

export function ResultCard({ item }: ResultCardProps) {
  const { startProxy } = useSearchStore();
  const openAIContext = useAIStore((s) => s.openWithContext);
  const toggleAI = useAIStore((s) => s.togglePanel);
  const incrementPages = usePrivacyStore((s) => s.incrementPages);
  const addBytesSaved = usePrivacyStore((s) => s.addBytesSaved);
  const [imgError, setImgError] = useState(false);
  const { t } = useTranslation();

  const domain = getDomain(item.url);
  const anonProxy = () => {
    incrementPages();
    addBytesSaved(180 * 1024);
    startProxy(item.url, item.name);
  };
  const summarize = () => {
    openAIContext(item.url, item.name);
    toggleAI(true);
  };

  return (
    <article className="group rounded-xl border border-border bg-card/40 hover:bg-card/70 hover:border-primary/30 transition-colors p-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-background/60 border border-border flex items-center justify-center">
          {!imgError ? (
            <img
              src={faviconFor(item)}
              alt=""
              className="w-5 h-5 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <Globe className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="truncate dir-ltr">{domain}</span>
            <PrivacyGrade url={item.url} />
            {item.date && item.date !== "N/A" && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <Clock className="w-3 h-3" />
                  {item.date}
                </span>
              </>
            )}
          </div>

          <h3 className="mt-0.5 font-semibold text-base leading-snug">
            <button
              onClick={anonProxy}
              title={t("result.anonTitle")}
              className="text-right text-foreground hover:text-primary transition-colors"
            >
              {item.name || domain}
            </button>
          </h3>

          {item.snippet && (
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {item.snippet}
            </p>
          )}

          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={anonProxy}
              className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ShieldOff className="w-3.5 h-3.5 ml-1.5" />
              {t("result.anonBrowse")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={summarize}
              className="h-8 border-border hover:border-primary/40"
              title={t("result.summarizeTitle")}
            >
              <EyeOff className="w-3.5 h-3.5 ml-1.5" />
              {t("result.summarize")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              asChild
              className="h-8 text-muted-foreground"
            >
              <a href={item.url} target="_blank" rel="noopener noreferrer nofollow">
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                {t("result.direct")}
              </a>
            </Button>
            <Badge
              variant="outline"
              className="h-8 border-primary/30 text-primary/80 gap-1 text-[10px]"
              title="يُجلب المحتوى عبر الخادم — IP الحقيقي لا يصل للموقع"
            >
              <EyeOff className="w-3 h-3" />
              {t("result.ipHidden")}
            </Badge>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ResultSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card/30 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 bg-muted rounded" />
          <div className="h-5 w-3/4 bg-muted/70 rounded" />
          <div className="h-3 w-full bg-muted/50 rounded" />
          <div className="h-3 w-5/6 bg-muted/50 rounded" />
          <div className="flex gap-2 mt-2">
            <div className="h-8 w-28 bg-primary/20 rounded" />
            <div className="h-8 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
