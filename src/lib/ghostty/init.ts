import type { Ghostty } from "ghostty-web";

// postinstall copies ghostty-web's WASM here (see package.json). Loading it
// by path skips ghostty-web's default first attempt, a data: URL that our
// Content Security Policy blocks.
const GHOSTTY_WASM_PATH = "/ghostty-vt.wasm";

let instance: Ghostty | null = null;
let loadPromise: Promise<Ghostty> | null = null;

/** Load the Ghostty WASM once and share it; pass it to each `Terminal`. */
export async function initGhostty(): Promise<Ghostty> {
  if (instance) {
    return instance;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      // Dynamic import keeps ghostty-web (and its WASM loader) out of the
      // page bundle until the preview is opened.
      const { Ghostty } = await import("ghostty-web");
      instance = await Ghostty.load(GHOSTTY_WASM_PATH);
      return instance;
    } catch (error) {
      loadPromise = null;
      throw error;
    }
  })();

  return loadPromise;
}

export function isGhosttyInitialized(): boolean {
  return instance !== null;
}
