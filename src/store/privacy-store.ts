import { create } from "zustand";

export interface RelayNode {
  label: string;
  role: "entry" | "middle" | "exit";
  country: string;
  flag: string;
  ip: string;
  latencyMs: number;
  load: number; // 0-100 percent
}

interface PrivacyState {
  // Initialization flag — prevents hydration mismatch
  initialized: boolean;

  connected: boolean;
  sessionId: string;
  sessionIssuedAt: number;
  encryption: "AES-256-GCM" | "ChaCha20-Poly1305";
  relays: RelayNode[];
  visibleIp: string;
  firewallActive: boolean;
  blockedAttempts: number;
  queriesCount: number;
  pagesProxied: number;
  bytesSaved: number;

  // Call this once on client mount to populate random values
  initialize: () => void;
  connect: () => void;
  disconnect: () => void;
  rotateCircuit: () => void;
  newIdentity: () => void;
  initBlockedAttempts: () => void;
  recordBlockedAttempt: (n?: number) => void;
  incrementQueries: () => void;
  incrementPages: () => void;
  addBytesSaved: (n: number) => void;
}

// Pool of relay nodes (visual metadata only - represents the routing nodes)
const POOL: { role: RelayNode["role"]; country: string; flag: string }[] = [
  { role: "entry", country: "ألمانيا", flag: "DE" },
  { role: "entry", country: "هولندا", flag: "NL" },
  { role: "entry", country: "سويسرا", flag: "CH" },
  { role: "entry", country: "النمسا", flag: "AT" },
  { role: "middle", country: "السويد", flag: "SE" },
  { role: "middle", country: "آيسلندا", flag: "IS" },
  { role: "middle", country: "النرويج", flag: "NO" },
  { role: "middle", country: "فنلندا", flag: "FI" },
  { role: "middle", country: "الدنمارك", flag: "DK" },
  { role: "exit", country: "فرنسا", flag: "FR" },
  { role: "exit", country: "رومانيا", flag: "RO" },
  { role: "exit", country: "تشيكيا", flag: "CZ" },
  { role: "exit", country: "البرتغال", flag: "PT" },
  { role: "exit", country: "إسبانيا", flag: "ES" },
];

const ROLE_LABELS: Record<RelayNode["role"], string> = {
  entry: "حارس الدخول",
  middle: "عقدة وسيطة",
  exit: "عقدة الخروج",
};

function randomIp(): string {
  const o = () => Math.floor(Math.random() * 255) + 1;
  return `${o()}.${o()}.${o()}.${o()}`;
}

function randomSessionId(): string {
  const seg = (n: number) =>
    Array.from({ length: n }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]
    ).join("");
  return `SHB-${seg(4)}-${seg(4)}`;
}

function buildCircuit(): RelayNode[] {
  const entry = POOL.filter((p) => p.role === "entry");
  const middle = POOL.filter((p) => p.role === "middle");
  const exit = POOL.filter((p) => p.role === "exit");
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  return [
    { ...pick(entry), role: "entry" },
    { ...pick(middle), role: "middle" },
    { ...pick(exit), role: "exit" },
  ].map((p) => ({
    ...p,
    label: ROLE_LABELS[p.role],
    ip: randomIp(),
    latencyMs: Math.floor(Math.random() * 80) + 20,
    load: Math.floor(Math.random() * 70) + 10,
  }));
}

// Deterministic defaults for SSR — prevent hydration mismatch
const DETERMINISTIC_DEFAULTS = {
  initialized: false,
  connected: true,
  sessionId: "",
  sessionIssuedAt: 0,
  encryption: "ChaCha20-Poly1305" as const,
  relays: [] as RelayNode[],
  visibleIp: "",
  firewallActive: true,
  blockedAttempts: 0,
  queriesCount: 0,
  pagesProxied: 0,
  bytesSaved: 0,
};

export const usePrivacyStore = create<PrivacyState>((set) => ({
  ...DETERMINISTIC_DEFAULTS,

  // Called once on client mount to populate random values
  initialize: () =>
    set({
      initialized: true,
      sessionId: randomSessionId(),
      sessionIssuedAt: Date.now(),
      relays: buildCircuit(),
      visibleIp: randomIp(),
      blockedAttempts: Math.floor(Math.random() * 12) + 3,
    }),

  connect: () =>
    set({
      connected: true,
      relays: buildCircuit(),
      sessionId: randomSessionId(),
      sessionIssuedAt: Date.now(),
    }),
  disconnect: () => set({ connected: false }),
  rotateCircuit: () =>
    set({
      relays: buildCircuit(),
      visibleIp: randomIp(),
    }),
  newIdentity: () =>
    set({
      relays: buildCircuit(),
      visibleIp: randomIp(),
      sessionId: randomSessionId(),
      sessionIssuedAt: Date.now(),
      queriesCount: 0,
      pagesProxied: 0,
      bytesSaved: 0,
    }),
  initBlockedAttempts: () =>
    set({ blockedAttempts: Math.floor(Math.random() * 12) + 3 }),
  recordBlockedAttempt: (n = 1) =>
    set((s) => ({ blockedAttempts: s.blockedAttempts + n })),
  incrementQueries: () => set((s) => ({ queriesCount: s.queriesCount + 1 })),
  incrementPages: () => set((s) => ({ pagesProxied: s.pagesProxied + 1 })),
  addBytesSaved: (n) => set((s) => ({ bytesSaved: s.bytesSaved + n })),
}));
