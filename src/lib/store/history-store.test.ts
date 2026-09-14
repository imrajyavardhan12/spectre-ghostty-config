import { beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";
import {
  HISTORY_COALESCE_WINDOW_MS,
  HISTORY_LIMIT,
  useHistoryStore,
} from "@/lib/store/history-store";

function state() {
  return useHistoryStore.getState();
}

describe("history-store", () => {
  beforeEach(() => {
    vi.useRealTimers();
    act(() => {
      state().clear();
    });
  });

  it("starts empty with safe no-op undo and redo", () => {
    expect(state().past).toEqual([]);
    expect(state().future).toEqual([]);
    expect(state().undo({})).toBeNull();
    expect(state().redo({})).toBeNull();
  });

  it("traverses record, undo, and redo in order", () => {
    // Distinct keys: same-key synchronous records coalesce by design.
    act(() => {
      state().record({ a: 1 }, "a");
      state().record({ b: 2 }, "b");
    });

    let restored: unknown;
    act(() => {
      restored = state().undo({ b: 3 });
    });
    expect(restored).toEqual({ b: 2 });

    act(() => {
      restored = state().undo({ b: 2 });
    });
    expect(restored).toEqual({ a: 1 });
    expect(state().undo({})).toBeNull();

    act(() => {
      restored = state().redo({ a: 1 });
    });
    expect(restored).toEqual({ b: 2 });
    act(() => {
      restored = state().redo({ b: 2 });
    });
    expect(restored).toEqual({ b: 3 });
    expect(state().redo({})).toBeNull();
  });

  it("clears redo when a new edit lands", () => {
    act(() => {
      state().record({ a: 1 });
      state().record({ a: 2 });
    });
    act(() => {
      state().undo({ a: 3 });
    });
    expect(state().future).toHaveLength(1);

    act(() => {
      state().record({ a: 4 });
    });
    expect(state().future).toEqual([]);
    expect(state().redo({})).toBeNull();
  });

  it("evicts oldest entries past the cap", () => {
    for (let i = 0; i < HISTORY_LIMIT + 1; i++) {
      const key = `key-${i}`;
      act(() => {
        state().record({ [key]: i }, key);
      });
    }
    expect(state().past).toHaveLength(HISTORY_LIMIT);

    // Undo newest-first through the whole stack: the evicted key-0 never
    // comes back, and the surviving oldest entry is key-1.
    let restored: unknown;
    for (let i = 0; i < HISTORY_LIMIT; i++) {
      act(() => {
        restored = state().undo({});
      });
    }
    expect(restored).toEqual({ "key-1": 1 });
    expect(state().undo({})).toBeNull();
  });

  it("coalesces rapid same-key edits and splits slow or different ones", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);

    act(() => {
      state().record({ "font-size": 14 }, "font-size");
    });
    vi.setSystemTime(1_000_000 + HISTORY_COALESCE_WINDOW_MS - 1);
    act(() => {
      state().record({ "font-size": 15 }, "font-size");
    });
    expect(state().past).toHaveLength(1);

    // Undoing the coalesced burst restores the pre-burst state, not an
    // intermediate keystroke.
    let restored: unknown;
    act(() => {
      restored = state().undo({ "font-size": 15 });
    });
    expect(restored).toEqual({ "font-size": 14 });

    act(() => {
      state().record({ "font-size": 14 }, "font-size");
    });
    vi.setSystemTime(1_000_000 + 2 * HISTORY_COALESCE_WINDOW_MS);
    act(() => {
      state().record({ "font-size": 16 }, "font-size");
    });
    expect(state().past).toHaveLength(2);

    act(() => {
      state().record({ "font-family": "x" }, "font-family");
    });
    expect(state().past).toHaveLength(3);

    // Keyless entries (resets, imports) never coalesce.
    act(() => {
      state().record({});
      state().record({});
    });
    expect(state().past).toHaveLength(5);
  });

  it("snapshots defensively so later mutations cannot corrupt history", () => {
    const snapshot = { "font-family": ["a"] };
    act(() => {
      state().record(snapshot, "font-family");
    });
    (snapshot["font-family"] as string[]).push("b");

    let restored: unknown;
    act(() => {
      restored = state().undo({ "font-family": ["a", "b", "c"] });
    });
    expect(restored).toEqual({ "font-family": ["a"] });
  });

  it("clears both stacks", () => {
    act(() => {
      state().record({ a: 1 });
      state().undo({ a: 2 });
      state().clear();
    });
    expect(state().past).toEqual([]);
    expect(state().future).toEqual([]);
  });
});
