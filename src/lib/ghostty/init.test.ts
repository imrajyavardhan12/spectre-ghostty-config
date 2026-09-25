import { beforeEach, describe, expect, it, vi } from "vitest";

const initMock = vi.hoisted(() => vi.fn<() => Promise<void>>());

vi.mock("ghostty-web", () => ({ init: initMock }));

async function loadModule() {
  vi.resetModules();
  return import("@/lib/ghostty/init");
}

describe("initGhostty", () => {
  beforeEach(() => {
    initMock.mockReset();
  });

  it("initializes once and shares the in-flight promise", async () => {
    initMock.mockResolvedValue(undefined);
    const { initGhostty, isGhosttyInitialized } = await loadModule();

    expect(isGhosttyInitialized()).toBe(false);
    await Promise.all([initGhostty(), initGhostty()]);
    await initGhostty();

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(isGhosttyInitialized()).toBe(true);
  });

  it("allows a retry after a failed initialization", async () => {
    initMock.mockRejectedValueOnce(new Error("wasm failed")).mockResolvedValue(undefined);
    const { initGhostty, isGhosttyInitialized } = await loadModule();

    await expect(initGhostty()).rejects.toThrow("wasm failed");
    expect(isGhosttyInitialized()).toBe(false);

    await initGhostty();
    expect(initMock).toHaveBeenCalledTimes(2);
    expect(isGhosttyInitialized()).toBe(true);
  });
});
