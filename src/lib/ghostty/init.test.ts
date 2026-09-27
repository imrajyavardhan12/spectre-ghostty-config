import { beforeEach, describe, expect, it, vi } from "vitest";

const initMock = vi.hoisted(() => vi.fn<(path?: string) => Promise<{ id: string }>>());

vi.mock("ghostty-web", () => ({ Ghostty: { load: initMock } }));

async function loadModule() {
  vi.resetModules();
  return import("@/lib/ghostty/init");
}

describe("initGhostty", () => {
  beforeEach(() => {
    initMock.mockReset();
  });

  it("initializes once and shares the in-flight promise", async () => {
    const ghostty = { id: "ghostty" };
    initMock.mockResolvedValue(ghostty);
    const { initGhostty, isGhosttyInitialized } = await loadModule();

    expect(isGhosttyInitialized()).toBe(false);
    const [first, second] = await Promise.all([initGhostty(), initGhostty()]);
    expect(await initGhostty()).toBe(ghostty);
    expect(first).toBe(ghostty);
    expect(second).toBe(ghostty);

    expect(initMock).toHaveBeenCalledTimes(1);
    // Loads the copied WASM file directly instead of the CSP-blocked data: URL.
    expect(initMock).toHaveBeenCalledWith("/ghostty-vt.wasm");
    expect(isGhosttyInitialized()).toBe(true);
  });

  it("allows a retry after a failed initialization", async () => {
    initMock.mockRejectedValueOnce(new Error("wasm failed")).mockResolvedValue({ id: "ghostty" });
    const { initGhostty, isGhosttyInitialized } = await loadModule();

    await expect(initGhostty()).rejects.toThrow("wasm failed");
    expect(isGhosttyInitialized()).toBe(false);

    await initGhostty();
    expect(initMock).toHaveBeenCalledTimes(2);
    expect(isGhosttyInitialized()).toBe(true);
  });
});
