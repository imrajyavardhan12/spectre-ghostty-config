"use client";

import { useId, useRef } from "react";
import { CircleX, FileText, FileX2, Info, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ConfigValues } from "@/lib/schema/types";
import { isRepeatableOption } from "@/lib/utils/config-options";
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
  const descriptionId = useId();
  const replaceNoticeId = useId();
  const effectiveInstructions = analysis.instructions.filter(
    (instruction) =>
      instruction.disposition === "retained" ||
      instruction.disposition === "reset"
  );
  const hasUnknownInstructions = effectiveInstructions.some(
    (instruction) => !instruction.known
  );
  const hasRepeatableInstructions = effectiveInstructions.some(
    (instruction) => instruction.known && isRepeatableOption(instruction.key)
  );
  const hasUnresolvedConfigFiles = analysis.diagnostics.some(
    (diagnostic) => diagnostic.code === "config-file-not-resolved"
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

  const chip = "inline-flex h-[26px] items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-muted-foreground";
  const sectionHeading = "flex items-center gap-2 text-[13px] font-semibold";
  const sectionCount = "font-mono text-[11px] font-medium text-subtle-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        // The destructive consequence in the footer is part of what is announced on open.
        aria-describedby={`${descriptionId} ${replaceNoticeId}`}
        className="flex max-h-[calc(100dvh-4rem)] flex-col gap-0 overflow-hidden rounded-[14px] bg-popover p-0 shadow-lg sm:max-w-[640px] max-md:top-0 max-md:left-0 max-md:h-dvh max-md:max-h-none max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-border px-[22px] pt-5 pb-4">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-[17px] leading-snug font-semibold tracking-[-0.01em]">
              Review import
            </DialogTitle>
            <DialogDescription id={descriptionId} className="mt-1 text-[13px]">
              Nothing changes until you confirm.
            </DialogDescription>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className={`${chip} min-w-0 bg-muted font-mono`}>
                <FileText className="size-[13px] shrink-0" aria-hidden="true" />
                <span className="break-all">{fileName}</span>
                <span aria-hidden="true">·</span>
                {formatFileSize(fileSize)}
              </span>
              <span className={chip}>
                {analysis.summary.acceptedInstructionCount} accepted{" "}
                {analysis.summary.acceptedInstructionCount === 1 ? "instruction" : "instructions"}
              </span>
              <span className={chip}>
                {analysis.summary.effectiveInstructionCount} effective{" "}
                {analysis.summary.effectiveInstructionCount === 1 ? "instruction" : "instructions"}
              </span>
              <span className={chip}>
                {resultingCount} resulting {resultingCount === 1 ? "setting" : "settings"}
              </span>
              {skippedCount > 0 && (
                <span className={`${chip} border-transparent bg-destructive-soft text-destructive-foreground`}>
                  <CircleX className="size-3" aria-hidden="true" />
                  {skippedCount} skipped {skippedCount === 1 ? "line" : "lines"}
                </span>
              )}
            </div>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="-mt-1 -mr-1.5 size-8" aria-label="Close">
              <X className="size-4" />
            </Button>
          </DialogClose>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-[22px] py-4">
          {analysis.diagnostics.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className={sectionHeading}>
                Issues<span className={sectionCount}>{analysis.diagnostics.length}</span>
              </h3>
              <ul className="flex flex-col gap-2 text-[13px] leading-normal" aria-label="Import issues">
                {analysis.diagnostics.map((diagnostic) => {
                  const Icon =
                    diagnostic.severity === "error"
                      ? CircleX
                      : diagnostic.severity === "warning"
                        ? TriangleAlert
                        : Info;
                  return (
                    <li
                      key={`${diagnostic.lineNumber}-${diagnostic.code}`}
                      className={cn(
                        "flex gap-2.5 rounded-lg border px-3 py-2.5 wrap-anywhere",
                        diagnostic.severity === "error" &&
                          "border-destructive-border bg-destructive-soft text-destructive-foreground",
                        diagnostic.severity === "warning" &&
                          "border-warning-border bg-warning-soft text-warning-foreground",
                        diagnostic.severity === "info" && "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="mt-0.5 size-[15px] shrink-0" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <strong className="font-semibold">
                          {`${formatDiagnosticSeverity(diagnostic)} · Line ${diagnostic.lineNumber}`}
                        </strong>
                        {diagnostic.key && (
                          <>
                            {" · "}
                            <a
                              href={getDiagnosticSourceUrl(diagnostic)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Ghostty reference for ${diagnostic.key}`}
                              aria-describedby={externalLinkDescriptionId}
                              className="font-mono underline underline-offset-2"
                            >
                              {diagnostic.key}
                            </a>
                          </>
                        )}
                        <span className="sr-only">: </span>
                        <span className="block">
                          {`${diagnostic.message}${formatRelatedLines(diagnostic)}`}
                          {diagnostic.rawValue !== undefined && (
                            <>
                              {" Source value: "}
                              <code className="font-mono">
                                {diagnostic.rawValue === "" ? "(empty)" : diagnostic.rawValue}
                              </code>
                              .
                            </>
                          )}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="flex flex-col gap-2">
            <h3 className={sectionHeading}>
              Instructions<span className={sectionCount}>{effectiveInstructions.length} {effectiveInstructions.length === 1 ? "line" : "lines"}</span>
            </h3>
            <div className="rounded-lg border border-border bg-card py-2 font-mono text-[12.5px] leading-[1.75]">
              {effectiveInstructions.length > 0 ? (
                <ol aria-label="Imported instructions">
                  {effectiveInstructions.map((instruction) => (
                    <li
                      key={`${instruction.lineNumber}-${instruction.key}`}
                      className="flex gap-2.5 px-3 wrap-anywhere"
                    >
                      <span className="w-7 shrink-0 text-right text-subtle-foreground">
                        <span className="sr-only">Line </span>
                        {instruction.lineNumber}
                      </span>
                      {/* Whitespace-only in a flex row: not drawn, but keeps the text readable. */}
                      {" "}
                      <span className="min-w-0 flex-1">
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
                      </span>
                      {!instruction.known && (
                        <span className="h-fit shrink-0 self-center rounded-[4px] bg-warning-border px-1.5 py-px font-sans text-[10.5px] font-medium text-warning-foreground">
                          Unverified
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="px-3 font-sans text-sm text-muted-foreground">No usable instructions found.</p>
              )}
            </div>

            {hasRepeatableInstructions && (
              <p className="text-xs leading-normal text-muted-foreground">
                Repeatable values keep their order within each option. Export may regroup
                different option keys.
              </p>
            )}
            {hasUnknownInstructions && (
              <p className="text-xs leading-normal text-muted-foreground">
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
          </section>

          {hasUnresolvedConfigFiles && (
            <section className="flex flex-col gap-2">
              <h3 className={sectionHeading}>Not read</h3>
              <div
                role="note"
                aria-label="Included config files were not read"
                className="flex items-start gap-2.5 rounded-lg border border-dashed border-border-strong px-3 py-2.5 text-[13px] leading-normal text-muted-foreground"
              >
                <FileX2 className="mt-0.5 size-[15px] shrink-0" aria-hidden="true" />
                <span>
                  Spectre did not read referenced config files. Counts cover only the selected
                  file, not Ghostty&apos;s final effective configuration after includes.
                </span>
              </div>
            </section>
          )}
        </div>

        <span id={externalLinkDescriptionId} className="sr-only">
          Opens in a new tab.
        </span>

        <DialogFooter className="shrink-0 flex-wrap items-center gap-2 border-t border-border px-[22px] py-3.5 flex-row">
          <span id={replaceNoticeId} className="min-w-[200px] flex-1 text-xs text-muted-foreground">
            Your {currentSettingCount} current {currentSettingCount === 1 ? "setting" : "settings"}{" "}
            will be replaced. Undo restores them.
          </span>
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
