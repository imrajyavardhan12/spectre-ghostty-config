import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Toaster } from "@/components/providers/Toaster";
import { useConfigStore } from "@/lib/store/config-store";
import { useHistoryStore } from "@/lib/store/history-store";
import { useToastStore } from "@/lib/store/toast-store";

beforeEach(() => {
  act(() => {
    useConfigStore.getState().resetAll();
    useHistoryStore.getState().clear();
    useToastStore.getState().dismiss();
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function resetOneSetting() {
  act(() => {
    useConfigStore.getState().setValue("font-size", 16);
    useConfigStore.getState().resetValues(["font-size"]);
    useToastStore.getState().show("Reset 1 setting");
  });
}

describe("Toaster", () => {
  it("announces the message and undoes the change it describes", () => {
    render(<Toaster />);
    resetOneSetting();

    expect(screen.getByRole("status")).toHaveTextContent("Reset 1 setting");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(useConfigStore.getState().config).toEqual({ "font-size": 16 });
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  });

  it("steps aside once another edit makes Undo ambiguous", () => {
    render(<Toaster />);
    resetOneSetting();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();

    act(() => {
      useConfigStore.getState().setValue("cursor-style", "bar");
    });

    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  });

  it("disappears after a few seconds", () => {
    vi.useFakeTimers();
    render(<Toaster />);
    resetOneSetting();

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  });

  it("waits while the pointer or focus is on it", () => {
    vi.useFakeTimers();
    render(<Toaster />);
    resetOneSetting();

    fireEvent.pointerEnter(screen.getByRole("button", { name: "Undo" }).parentElement!);
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();

    fireEvent.pointerLeave(screen.getByRole("button", { name: "Undo" }).parentElement!);
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  });
});
