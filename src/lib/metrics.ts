// In-memory aggregate metrics. NEVER persists, NEVER stores PII.
// Reset on process restart. Imported by API route handlers.

interface Metrics {
  totalSearches: number;
  totalProxied: number;
  cacheHits: number;
  cacheMisses: number;
  aiRequests: number;
  bytesSaved: number;
  firewallBlocks: number;
  startedAt: number;
}

const m: Metrics = {
  totalSearches: 0,
  totalProxied: 0,
  cacheHits: 0,
  cacheMisses: 0,
  aiRequests: 0,
  bytesSaved: 0,
  firewallBlocks: 0,
  startedAt: Date.now(),
};

export const metrics = {
  recordSearch(cacheHit: boolean) {
    m.totalSearches++;
    if (cacheHit) m.cacheHits++;
    else m.cacheMisses++;
  },
  recordProxy(cacheHit: boolean, bytesSaved: number) {
    m.totalProxied++;
    if (cacheHit) m.cacheHits++;
    else m.cacheMisses++;
    m.bytesSaved += bytesSaved || 0;
  },
  recordAI() {
    m.aiRequests++;
  },
  recordFirewallBlock(n = 1) {
    m.firewallBlocks += n;
  },
  snapshot() {
    return { ...m, uptime: Math.floor((Date.now() - m.startedAt) / 1000) };
  },
};
