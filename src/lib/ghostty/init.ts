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
      // Dynamic import keeps ghostty-web (and its WASM loader) out of the
      // page bundle until the preview is opened.
      const { init } = await import("ghostty-web");
      await init();
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
