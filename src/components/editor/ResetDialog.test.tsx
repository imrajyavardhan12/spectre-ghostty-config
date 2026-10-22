import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ResetDialog } from "@/components/editor/ResetDialog";

afterEach(cleanup);

function renderDialog(overrides: Partial<React.ComponentProps<typeof ResetDialog>> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    title: "Reset 2 Fonts settings?",
    confirmLabel: "Reset Fonts",
    entries: [
      { key: "font-size", value: "16" },
      { key: "font-family", value: "2 entries" },
    ],
    onConfirm: vi.fn(),
    ...overrides,
  };
  render(<ResetDialog {...props} />);
  return props;
}

describe("ResetDialog", () => {
  it("lists every setting with its value", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: "Reset 2 Fonts settings?" });
    expect(dialog).toHaveTextContent("font-size");
    expect(dialog).toHaveTextContent("16");
    expect(dialog).toHaveTextContent("2 entries");
  });

  it("makes the scrollable list reachable by keyboard", () => {
    renderDialog();

    expect(screen.getByRole("region", { name: "Settings that will be reset" })).toHaveAttribute("tabindex", "0");
  });

  it("starts on Cancel, the safe choice", () => {
    renderDialog();

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("confirms with the destructive button and cancels without resetting", () => {
    const props = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(props.onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Reset Fonts" }));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });
});
