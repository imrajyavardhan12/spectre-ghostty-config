"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ConfigValues } from "@/lib/schema/types";
import type { ImportAnalysis, ImportInstruction } from "@/lib/utils/config-import-analysis";

interface ImportReviewDialogProps {
  open: boolean;
  fileName: string;
  fileSize: number;
  currentSettingCount: number;
  analysis: ImportAnalysis;
  onOpenChange: (open: boolean) => void;
  onConfirm: (candidate: ConfigValues) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatInstruction(instruction: ImportInstruction): string {
  if (instruction.disposition === "reset") {
    return `${instruction.key} = (reset to default)`;
  }

  return `${instruction.key} = ${String(instruction.normalizedValue ?? "")}`;
}

export function ImportReviewDialog({
  open,
  fileName,
  fileSize,
  currentSettingCount,
  analysis,
  onOpenChange,
  onConfirm,
}: ImportReviewDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const effectiveInstructions = analysis.instructions.filter(
    (instruction) =>
      instruction.disposition === "retained" ||
      instruction.disposition === "reset"
  );
  const resultingCount = analysis.summary.resultingSettingCount;
  const actionLabel = !analysis.hasMeaningfulInstruction
    ? "Nothing usable to apply"
    : resultingCount === 0
      ? "Replace current config with defaults"
      : `Replace with ${resultingCount} ${resultingCount === 1 ? "setting" : "settings"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] sm:max-w-2xl"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Review imported configuration</DialogTitle>
          <DialogDescription>
            {currentSettingCount} current {currentSettingCount === 1 ? "setting" : "settings"}{" "}
            will be replaced. Nothing changes until you confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="min-w-0 break-all font-medium text-foreground">
            {fileName}
          </span>
          <span>{formatFileSize(fileSize)}</span>
          <span>{analysis.summary.acceptedInstructionCount} accepted instructions</span>
          <span>{resultingCount} resulting settings</span>
        </div>

        <div className="min-h-0 space-y-2 overflow-y-auto rounded-md border p-3">
          <h3 className="text-sm font-medium">Imported instructions</h3>
          {effectiveInstructions.length > 0 ? (
            <ol className="space-y-1 font-mono text-xs">
              {effectiveInstructions.map((instruction) => (
                <li key={`${instruction.lineNumber}-${instruction.key}`} className="break-words">
                  <span className="mr-2 text-muted-foreground">
                    Line {instruction.lineNumber}
                  </span>
                  {formatInstruction(instruction)}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">No usable instructions found.</p>
          )}
        </div>

        <DialogFooter>
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!analysis.hasMeaningfulInstruction}
            onClick={() => onConfirm(analysis.candidateConfig)}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
