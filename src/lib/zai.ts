import ZAI from "z-ai-web-dev-sdk";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

/**
 * Shared ZAI SDK client (server-side only).
 * Reused across API route handlers to avoid re-initializing on every request.
 */
export async function getZai() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}
