import { describe, expect, it, vi } from "vitest";

const analysisControl = vi.hoisted(() => ({ throwOnAnalyze: false }));

vi.mock("@/lib/utils/config-import-analysis", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/utils/config-import-analysis")>();
  return {
    ...actual,
    analyzeGhosttyConfig: (source: string) => {
      if (analysisControl.throwOnAnalyze) {
        throw new Error("unexpected analyzer failure");
      }
      return actual.analyzeGhosttyConfig(source);
    },
  };
});

import {
  ImportFileCoordinator,
  type PendingImportFile,
} from "@/lib/utils/config-import-coordinator";
import {
  IMPORT_FILE_LIMITS,
  type ImportFileError,
  type ImportFileLike,
} from "@/lib/utils/config-import-file";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createCoordinator() {
  const onStart = vi.fn<(token: number) => void>();
  const onSuccess = vi.fn<(pending: PendingImportFile) => void>();
  const onError = vi.fn<(error: ImportFileError) => void>();
  const coordinator = new ImportFileCoordinator({
    getCurrentSettingCount: () => 3,
    onStart,
    onSuccess,
    onError,
  });

  return { coordinator, onStart, onSuccess, onError };
}

describe("ImportFileCoordinator", () => {
  it("publishes only the newest deferred file analysis", async () => {
    const firstRead = deferred<string>();
    const secondRead = deferred<string>();
    const first: ImportFileLike = {
      name: "first-config",
      size: 16,
      text: () => firstRead.promise,
    };
    const second: ImportFileLike = {
      name: "config",
      size: 16,
      text: () => secondRead.promise,
    };
    const { coordinator, onStart, onSuccess, onError } = createCoordinator();

    const firstTask = coordinator.select(first);
    const secondTask = coordinator.select(second);
    secondRead.resolve("font-size = 18");
    await secondTask;
    firstRead.resolve("font-size = 14");
    await firstTask;

    expect(onStart.mock.calls.map(([token]) => token)).toEqual([1, 2]);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "config",
        currentSettingCount: 3,
      })
    );
    expect(onSuccess.mock.calls[0][0].analysis.candidateConfig["font-size"]).toBe(18);
    expect(onError).not.toHaveBeenCalled();
  });

  it("does not publish a stale read error after a newer success", async () => {
    const firstRead = deferred<string>();
    const secondRead = deferred<string>();
    const { coordinator, onSuccess, onError } = createCoordinator();

    const firstTask = coordinator.select({
      name: "unreadable",
      size: 16,
      text: () => firstRead.promise,
    });
    const secondTask = coordinator.select({
      name: "config",
      size: 16,
      text: () => secondRead.promise,
    });
    secondRead.resolve("font-size = 18");
    await secondTask;
    firstRead.reject(new DOMException("Denied", "NotReadableError"));
    await firstTask;

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("does not publish a stale validation error after a newer success", async () => {
    const firstRead = deferred<string>();
    const secondRead = deferred<string>();
    const { coordinator, onSuccess, onError } = createCoordinator();

    const firstTask = coordinator.select({
      name: "binary",
      size: 16,
      text: () => firstRead.promise,
    });
    const secondTask = coordinator.select({
      name: "config",
      size: 16,
      text: () => secondRead.promise,
    });
    secondRead.resolve("font-size = 18");
    await secondTask;
    firstRead.resolve("font-size = \0");
    await firstTask;

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("recovers from a current rejection on the next selection", async () => {
    const { coordinator, onStart, onSuccess, onError } = createCoordinator();
    const oversizedText = vi.fn(async () => "not read");

    await coordinator.select({
      name: "too-large",
      size: IMPORT_FILE_LIMITS.maxBytes + 1,
      text: oversizedText,
    });
    await coordinator.select({
      name: "config",
      size: 16,
      text: async () => "font-size = 18",
    });

    expect(oversizedText).not.toHaveBeenCalled();
    expect(onStart.mock.calls.map(([token]) => token)).toEqual([1, 2]);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "file-too-large" })
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("reports a local error when analysis throws unexpectedly", async () => {
    analysisControl.throwOnAnalyze = true;
    const { coordinator, onSuccess, onError } = createCoordinator();
    try {
      await coordinator.select({
        name: "config",
        size: 16,
        text: async () => "font-size = 18",
      });
    } finally {
      analysisControl.throwOnAnalyze = false;
    }

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "file-read-failed" })
    );
  });

  it("invalidates an in-flight selection when canceled", async () => {
    const read = deferred<string>();
    const { coordinator, onSuccess, onError } = createCoordinator();
    const task = coordinator.select({
      name: "config",
      size: 16,
      text: () => read.promise,
    });

    coordinator.cancel();
    read.resolve("font-size = 18");
    await task;

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
