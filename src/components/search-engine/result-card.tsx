"use client";

import { useState } from "react";
import { Globe, Clock, ImageOff } from "lucide-react";
import type { SearchResultItem } from "@/store/search-store";
import { useSearchStore } from "@/store/search-store";
import { usePrivacyStore } from "@/store/privacy-store";

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

function getPath(url: string) {
  try {
    const u = new URL(url);
    const p = u.pathname + u.search;
    return p.length > 60 ? p.slice(0, 57) + "…" : p;
  } catch {
    return url;
  }
}

function faviconUrl(item: SearchResultItem) {
  if (item.favicon) return item.favicon;
  const host = getDomain(item.url);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`;
}

export function ResultCard({ item }: ResultCardProps) {
  const { startProxy } = useSearchStore();
  const incrementPages = usePrivacyStore((s) => s.incrementPages);
  const [imgError, setImgError] = useState(false);

  const domain = getDomain(item.url);
  const path = getPath(item.url);

  const openResult = () => {
    incrementPages();
    startProxy(item.url, item.name);
  };

  return (
    <div className="group/py-[var(--result-gap,8px)] py-[var(--result-gap,8px)]">
      <div className="flex items-center gap-2 mb-0.5">
        <div className="w-5 h-5 shrink-0 rounded-sm overflow-hidden bg-transparent flex items-center justify-center">
          {!imgError ? (
            <img
              src={faviconUrl(item)}
              alt=""
              width={20}
              height={20}
              className="w-5 h-5 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <Globe className="w-3.5 h-3.5 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <span className="truncate dir-ltr">{domain}</span>
          <span className="text-muted-foreground/30 hidden sm:inline">·</span>
          <span className="truncate dir-ltr text-muted-foreground/60 hidden sm:inline">{path}</span>
          {item.date && item.date !== "N/A" && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                <Clock className="w-2.5 h-2.5" />
                {item.date}
              </span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={openResult}
        className="text-left w-full text-right"
      >
        <h3 className="text-[17px] sm:text-[20px] font-normal leading-snug text-[#8ab4f8] hover:underline cursor-pointer">
          {item.name || domain}
        </h3>
      </button>

      {item.snippet && (
        <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {item.snippet}
        </p>
      )}
    </div>
  );
}

export function ImageResultCard({ item }: ResultCardProps) {
  const { startProxy } = useSearchStore();
  const incrementPages = usePrivacyStore((s) => s.incrementPages);

  const openResult = () => {
    incrementPages();
    startProxy(item.url, item.name);
  };

  return (
    <button
      onClick={openResult}
      className="group text-left rounded-xl border border-border bg-card/40 overflow-hidden hover:border-primary/40 transition-colors"
    >
      <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center">
        <ImageOff className="w-8 h-8 text-muted-foreground/30" />
      </div>
      <div className="p-2">
        <div className="text-xs font-medium line-clamp-1">{item.name}</div>
        <div className="text-[10px] text-muted-foreground line-clamp-1 dir-ltr">
          {item.host_name}
        </div>
      </div>
    </button>
  );
}

export function ResultSkeleton() {
  return (
    <div className="py-2 animate-pulse">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-5 h-5 rounded-sm bg-muted" />
        <div className="h-3 w-40 bg-muted rounded" />
      </div>
      <div className="h-5 w-3/4 bg-muted/70 rounded mt-1" />
      <div className="h-3.5 w-full bg-muted/40 rounded mt-1.5" />
      <div className="h-3.5 w-2/3 bg-muted/30 rounded mt-1" />
    </div>
  );
}
