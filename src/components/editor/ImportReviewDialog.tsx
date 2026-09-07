"use client";

import { useId, useRef } from "react";
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
import type {
  ImportAnalysis,
  ImportDiagnostic,
  ImportInstruction,
} from "@/lib/utils/config-import-analysis";

const GHOSTTY_CONFIG_REFERENCE_URL = "https://ghostty.org/docs/config/reference";
const SPECTRE_COMPATIBILITY_POLICY_URL =
  "https://github.com/imrajyavardhan12/spectre-ghostty-config/blob/main/COMPATIBILITY.md";

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

function formatInstructionValue(instruction: ImportInstruction): string {
  if (instruction.disposition === "reset") {
    return "(reset to default)";
  }

  return String(instruction.normalizedValue ?? "");
}

function formatDiagnosticSeverity(diagnostic: ImportDiagnostic): string {
  if (diagnostic.severity === "error") return "Error";
  if (diagnostic.severity === "warning") return "Warning";
  return "Info";
}

function formatRelatedLines(diagnostic: ImportDiagnostic): string {
  if (!diagnostic.relatedLineNumbers?.length) return "";

  const label = diagnostic.relatedLineNumbers.length === 1
    ? "Related line"
    : "Related lines";
  return ` ${label}: ${diagnostic.relatedLineNumbers.join(", ")}.`;
}

function getDiagnosticSourceUrl(diagnostic: ImportDiagnostic): string {
  return diagnostic.code === "unknown-option" ||
    diagnostic.code === "unsafe-option-name"
    ? GHOSTTY_CONFIG_REFERENCE_URL
    : `${GHOSTTY_CONFIG_REFERENCE_URL}#${diagnostic.key}`;
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
  const externalLinkDescriptionId = useId();
  const effectiveInstructions = analysis.instructions.filter(
    (instruction) =>
      instruction.disposition === "retained" ||
      instruction.disposition === "reset"
  );
  const hasUnknownInstructions = effectiveInstructions.some(
    (instruction) => !instruction.known
  );
  const resultingCount = analysis.summary.resultingSettingCount;
  const skippedCount = analysis.summary.skippedLineCount;
  const baseActionLabel = resultingCount === 0
    ? "Replace current config with defaults"
    : `Replace with ${resultingCount} ${resultingCount === 1 ? "setting" : "settings"}`;
  const actionLabel = !analysis.hasMeaningfulInstruction
    ? "Nothing usable to apply"
    : skippedCount > 0
      ? `${baseActionLabel} and skip ${skippedCount} ${skippedCount === 1 ? "line" : "lines"}`
      : baseActionLabel;

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
          {skippedCount > 0 && (
            <span>
              {skippedCount} skipped {skippedCount === 1 ? "line" : "lines"}
            </span>
          )}
        </div>

        <div className="min-h-0 space-y-2 overflow-y-auto rounded-md border p-3">
          <h3 className="text-sm font-medium">Imported instructions</h3>
          {effectiveInstructions.length > 0 ? (
            <ol
              className="space-y-1 font-mono text-xs"
              aria-label="Imported instructions"
            >
              {effectiveInstructions.map((instruction) => (
                <li key={`${instruction.lineNumber}-${instruction.key}`} className="break-words">
                  <span className="mr-2 text-muted-foreground">
                    Line {instruction.lineNumber}
                  </span>
                  <a
                    href={
                      instruction.known
                        ? `${GHOSTTY_CONFIG_REFERENCE_URL}#${instruction.key}`
                        : GHOSTTY_CONFIG_REFERENCE_URL
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-describedby={externalLinkDescriptionId}
                    className="underline decoration-muted-foreground underline-offset-2 hover:text-foreground"
                  >
                    {instruction.key}
                  </a>
                  {` = ${formatInstructionValue(instruction)}`}
                  {!instruction.known && (
                    <span className="ml-2 inline-flex rounded border px-1.5 py-0.5 font-sans text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
                      Unverified
                    </span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">No usable instructions found.</p>
          )}

          {hasUnknownInstructions && (
            <p className="text-xs text-muted-foreground">
              Unverified options are retained as strings but are outside Spectre&apos;s schema
              target. Review the{" "}
              <a
                href={SPECTRE_COMPATIBILITY_POLICY_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-describedby={externalLinkDescriptionId}
                className="underline underline-offset-2 hover:text-foreground"
              >
                Spectre compatibility policy
              </a>
              .
            </p>
          )}

          {analysis.diagnostics.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <h3 className="text-sm font-medium">Import issues</h3>
              <ul className="space-y-1 text-xs" aria-label="Import issues">
                {analysis.diagnostics.map((diagnostic) => (
                  <li
                    key={`${diagnostic.lineNumber}-${diagnostic.code}`}
                    className={
                      diagnostic.severity === "error"
                        ? "break-words text-destructive"
                        : "break-words text-amber-600 dark:text-amber-400"
                    }
                  >
                    {`${formatDiagnosticSeverity(diagnostic)} — Line ${diagnostic.lineNumber}`}
                    {diagnostic.key && (
                      <>
                        {" · "}
                        <a
                          href={getDiagnosticSourceUrl(diagnostic)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Ghostty reference for ${diagnostic.key}`}
                          aria-describedby={externalLinkDescriptionId}
                          className="underline underline-offset-2"
                        >
                          {diagnostic.key}
                        </a>
                      </>
                    )}
                    {`: ${diagnostic.message}${formatRelatedLines(diagnostic)}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <span id={externalLinkDescriptionId} className="sr-only">
          Opens in a new tab.
        </span>

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
