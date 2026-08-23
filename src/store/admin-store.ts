import { create } from "zustand";

// Aggregate admin metrics — never store a single query/URL/session.
// Session counters live in memory only (reset on server restart).
interface AdminState {
  // aggregate counters (in-memory, no persistence)
  totalSearches: number;
  totalProxiedPages: number;
  cacheHits: number;
  cacheMisses: number;
  aiRequests: number;
  firewallBlocks: number;
  bytesSaved: number;
  // latency buckets (last 50 samples)
  searchLatencySamples: number[];
  proxyLatencySamples: number[];
  // top-level domain buckets (anonymized counts only)
  tldBuckets: Record<string, number>;

  recordSearch: (latencyMs: number, cacheHit: boolean, tld?: string) => void;
  recordProxy: (latencyMs: number, cacheHit: boolean, bytesSaved: number) => void;
  recordAI: () => void;
  recordFirewallBlock: (n?: number) => void;
  reset: () => void;
}

const EMPTY: Pick<
  AdminState,
  | "totalSearches"
  | "totalProxiedPages"
  | "cacheHits"
  | "cacheMisses"
  | "aiRequests"
  | "firewallBlocks"
  | "bytesSaved"
  | "searchLatencySamples"
  | "proxyLatencySamples"
  | "tldBuckets"
> = {
  totalSearches: 0,
  totalProxiedPages: 0,
  cacheHits: 0,
  cacheMisses: 0,
  aiRequests: 0,
  firewallBlocks: 0,
  bytesSaved: 0,
  searchLatencySamples: [],
  proxyLatencySamples: [],
  tldBuckets: {},
};

function tldOf(url?: string) {
  if (!url) return "unknown";
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    const parts = h.split(".");
    if (parts.length < 2) return h;
    return parts[parts.length - 1];
  } catch {
    return "unknown";
  }
}

function pushSample(arr: number[], v: number) {
  const next = [...arr, v];
  if (next.length > 50) next.shift();
  return next;
}

export const useAdminStore = create<AdminState>((set) => ({
  ...EMPTY,
  recordSearch: (latencyMs, cacheHit, tld) =>
    set((s) => ({
      totalSearches: s.totalSearches + 1,
      cacheHits: s.cacheHits + (cacheHit ? 1 : 0),
      cacheMisses: s.cacheMisses + (cacheHit ? 0 : 1),
      searchLatencySamples: pushSample(s.searchLatencySamples, latencyMs),
      tldBuckets: {
        ...s.tldBuckets,
        [tld || tldOf()]: (s.tldBuckets[tld || tldOf()] || 0) + 1,
      },
    })),
  recordProxy: (latencyMs, cacheHit, bytesSaved) =>
    set((s) => ({
      totalProxiedPages: s.totalProxiedPages + 1,
      cacheHits: s.cacheHits + (cacheHit ? 1 : 0),
      cacheMisses: s.cacheMisses + (cacheHit ? 0 : 1),
      bytesSaved: s.bytesSaved + bytesSaved,
      proxyLatencySamples: pushSample(s.proxyLatencySamples, latencyMs),
    })),
  recordAI: () => set((s) => ({ aiRequests: s.aiRequests + 1 })),
  recordFirewallBlock: (n = 1) =>
    set((s) => ({ firewallBlocks: s.firewallBlocks + n })),
  reset: () => set({ ...EMPTY }),
}));
