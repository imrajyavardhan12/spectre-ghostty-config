"use client";

import { useRef } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ResetEntry } from "@/lib/utils/reset-scope";

interface ResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  confirmLabel: string;
  entries: ResetEntry[];
  onConfirm: () => void;
  /** Where focus goes on close when the dialog was opened from a menu that has since closed. */
  onCloseAutoFocus?: (event: Event) => void;
}

/** Confirms a reset by listing exactly which settings go back to Ghostty's defaults. */
export function ResetDialog({
  open,
  onOpenChange,
  title,
  confirmLabel,
  entries,
  onConfirm,
  onCloseAutoFocus,
}: ResetDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 rounded-[14px] bg-popover p-0 shadow-lg sm:max-w-[460px]"
        onOpenAutoFocus={(event) => {
          // A destructive action: start on the safe choice.
          event.preventDefault();
          cancelRef.current?.focus();
        }}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <div className="flex flex-col gap-2.5 px-[22px] pt-[22px] pb-3.5">
          <span className="grid size-9 place-items-center rounded-[9px] bg-destructive-soft text-destructive-foreground">
            <RotateCcw className="size-[18px]" aria-hidden="true" />
          </span>
          <DialogTitle className="text-[17px] leading-snug font-semibold tracking-[-0.01em]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-[1.55] text-pretty">
            These return to Ghostty&apos;s defaults and leave your exported config.{" "}
            <strong className="font-semibold text-foreground">Undo (Ctrl/Cmd+Z)</strong> or the
            toast brings them back.
          </DialogDescription>
          {/* Scrollable, so it must be reachable by keyboard. */}
          <div
            role="region"
            aria-label="Settings that will be reset"
            tabIndex={0}
            className="max-h-[200px] overflow-y-auto rounded-lg border border-border bg-card py-1.5 font-mono text-[12.5px] leading-[1.85] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {entries.map(({ key, value }) => (
              <div key={key} className="flex gap-2.5 px-3">
                <span className="min-w-0 flex-1 truncate">{key}</span>
                <span className="max-w-[45%] truncate text-subtle-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter className="flex-row justify-end px-[22px] pt-1.5 pb-5">
          <Button ref={cancelRef} type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
