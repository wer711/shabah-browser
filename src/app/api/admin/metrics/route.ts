import { NextResponse } from "next/server";
import os from "os";
import { metrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sampleSystem() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const c of cpus) {
    for (const type in c.times) (total += (c.times as any)[type]);
    idle += c.times.idle;
  }
  const cpuPercent = total > 0 ? Math.round(((1 - idle / total) * 100 + Number.EPSILON) * 10) / 10 : 0;
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memPercent = Math.round((1 - freeMem / totalMem) * 100);
  const snap = metrics.snapshot();
  const netPercent = Math.min(100, Math.round(snap.aiRequests * 2 + snap.totalSearches));
  return { cpuPercent, memPercent, netPercent };
}

export async function GET() {
  const sys = sampleSystem();
  return NextResponse.json({
    ...metrics.snapshot(),
    ...sys,
  });
}
