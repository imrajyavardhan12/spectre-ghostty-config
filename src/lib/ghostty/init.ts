import { init as ghosttyInit } from "ghostty-web";

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function initGhostty(): Promise<void> {
  if (initialized) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      await ghosttyInit();
      initialized = true;
    } catch (error) {
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

export function isGhosttyInitialized(): boolean {
  return initialized;
}
