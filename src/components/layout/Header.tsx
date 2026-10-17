"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Download,
  Ellipsis,
  FileUp,
  GitBranch,
  Ghost,
  Layers,
  Loader2,
  Palette,
  Redo2,
  RotateCcw,
  Search,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfigStore } from "@/lib/store/config-store";
import { useCanRedo, useCanUndo, useHistoryStore } from "@/lib/store/history-store";
import { ImportReviewDialog } from "@/components/editor/ImportReviewDialog";
import { PresetsDialog } from "@/components/editor/PresetsDialog";
import { allOptions } from "@/data/ghostty-options";
import { TABLET_QUERY, useMediaQuery, WIDE_QUERY } from "@/lib/hooks/use-media-query";
import {
  ImportFileCoordinator,
  type PendingImportFile,
} from "@/lib/utils/config-import-coordinator";
import type { ConfigValues } from "@/lib/schema/types";
import { SPECTRE_VERSION } from "@/lib/version";

const GITHUB_URL = "https://github.com/imrajyavardhan12/spectre-ghostty-config";
const GHOSTTY_DOCS_URL = "https://ghostty.org/docs/config";

/** CommandSearch listens for ⌘K on the document. */
function openCommandSearch() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
}

/** An icon-only control; universal actions get a tooltip and an aria-label instead of a visible label. */
function IconAction({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function describeConfigCount(): string {
  const count = Object.keys(useConfigStore.getState().config).length;
  return count === 0 ? "no settings" : `${count} ${count === 1 ? "setting" : "settings"}`;
}

export function Header() {
  // Use selectors to properly subscribe to config changes
  const config = useConfigStore((state) => state.config);
  const exportConfig = useConfigStore((state) => state.exportConfig);
  const resetAll = useConfigStore((state) => state.resetAll);
  const undo = useConfigStore((state) => state.undo);
  const redo = useConfigStore((state) => state.redo);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [historyMessage, setHistoryMessage] = useState("");
  const modifiedCount = Object.keys(config).length;
  const [exportState, setExportState] = useState<"idle" | "loading" | "success">("idle");
  const [importState, setImportState] = useState<"idle" | "loading" | "success">("idle");
  const [importStatusMessage, setImportStatusMessage] = useState("");
  const [importErrorMessage, setImportErrorMessage] = useState("");
  const [pendingImport, setPendingImport] = useState<PendingImportFile | null>(null);
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const presetsReturnRef = useRef<HTMLButtonElement | null>(null);
  // Actions that don't fit the header at this width move into the overflow menu.
  const isWide = useMediaQuery(WIDE_QUERY);
  const isTablet = useMediaQuery(TABLET_QUERY);
  const importFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const importCoordinatorRef = useRef<ImportFileCoordinator | null>(null);

  const clearImportFeedbackTimer = () => {
    if (importFeedbackTimerRef.current !== null) {
      clearTimeout(importFeedbackTimerRef.current);
      importFeedbackTimerRef.current = null;
    }
  };

  const announceHistory = useCallback((message: string) => {
    setHistoryMessage(message);
  }, []);

  const handleUndo = useCallback(() => {
    if (useHistoryStore.getState().past.length === 0) {
      announceHistory("Nothing to undo.");
      return;
    }
    undo();
    announceHistory(`Undid change (${describeConfigCount()}).`);
  }, [undo, announceHistory]);

  const handleRedo = useCallback(() => {
    if (useHistoryStore.getState().future.length === 0) {
      announceHistory("Nothing to redo.");
      return;
    }
    redo();
    announceHistory(`Redid change (${describeConfigCount()}).`);
  }, [redo, announceHistory]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // Native text undo wins inside editable fields; store history applies
      // everywhere else. This precedence is intentional and documented.
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (!event.metaKey && !event.ctrlKey) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        handleRedo();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleUndo, handleRedo]);

  useEffect(() => {
    const coordinator = new ImportFileCoordinator({
      getCurrentSettingCount: () =>
        Object.keys(useConfigStore.getState().config).length,
      onStart: () => {
        if (importFeedbackTimerRef.current !== null) {
          clearTimeout(importFeedbackTimerRef.current);
          importFeedbackTimerRef.current = null;
        }
        setPendingImport(null);
        setImportStatusMessage("");
        setImportErrorMessage("");
        setImportState("loading");
      },
      onSuccess: (pending) => {
        setPendingImport(pending);
        setImportState("idle");
      },
      onError: (error) => {
        setImportErrorMessage(error.message);
        setImportState("idle");
      },
    });
    importCoordinatorRef.current = coordinator;

    return () => {
      coordinator.cancel();
      importCoordinatorRef.current = null;
      if (importFeedbackTimerRef.current !== null) {
        clearTimeout(importFeedbackTimerRef.current);
      }
    };
  }, []);

  const handleExport = async () => {
    setExportState("loading");
    
    // Simulate slight delay for feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const configString = exportConfig();
    const blob = new Blob([configString], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setExportState("success");
    setTimeout(() => setExportState("idle"), 2000);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) void importCoordinatorRef.current?.select(file);
    };
    input.click();
  };

  const restoreImportFocus = () => {
    // Import lives in the overflow menu below the wide breakpoint.
    setTimeout(() => {
      const importButton = importButtonRef.current;
      // offsetParent is null while the button is display:none.
      (importButton?.offsetParent ? importButton : moreButtonRef.current)?.focus();
    }, 0);
  };

  const openPresets = (returnFocusTo: HTMLButtonElement | null) => {
    presetsReturnRef.current = returnFocusTo;
    setPresetsOpen(true);
  };

  const transientIcon = (state: "idle" | "loading" | "success", idle: React.ReactNode) =>
    state === "loading" ? (
      <Loader2 className="animate-spin" />
    ) : state === "success" ? (
      <Check className="text-success" />
    ) : (
      idle
    );

  const closeImportReview = () => {
    setPendingImport(null);
    restoreImportFocus();
  };

  const handleConfirmImport = (candidate: ConfigValues) => {
    const resultingCount = pendingImport?.analysis.summary.resultingSettingCount ?? 0;
    const skippedCount = pendingImport?.analysis.summary.skippedLineCount ?? 0;
    useConfigStore.getState().applyImportedCandidate(candidate);
    setPendingImport(null);
    setImportErrorMessage("");
    setImportState("success");
    const resultMessage = resultingCount === 0
      ? "Imported configuration defaults"
      : `Imported ${resultingCount} ${resultingCount === 1 ? "setting" : "settings"}`;
    const skippedMessage = skippedCount > 0
      ? ` and skipped ${skippedCount} ${skippedCount === 1 ? "line" : "lines"}`
      : "";
    setImportStatusMessage(`${resultMessage}${skippedMessage}.`);
    restoreImportFocus();
    clearImportFeedbackTimer();
    importFeedbackTimerRef.current = setTimeout(() => {
      setImportState("idle");
      setImportStatusMessage("");
      importFeedbackTimerRef.current = null;
    }, 2000);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <TooltipProvider>
        <div className="flex h-14 w-full items-center gap-3 px-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Ghost className="size-5 text-primary" aria-hidden="true" />
            <span className="sr-only text-[15px] font-semibold tracking-tight min-[360px]:not-sr-only">
              Spectre
            </span>
            <span className="hidden font-mono text-[11px] text-subtle-foreground xl:inline">
              v{SPECTRE_VERSION}
            </span>
          </Link>

          <button
            type="button"
            onClick={openCommandSearch}
            className="hidden h-8 w-full max-w-72 min-w-0 items-center gap-2 rounded-md border border-input bg-field px-2.5 text-[13px] text-subtle-foreground transition-colors hover:border-border-strong hover:text-muted-foreground md:flex xl:ml-6 xl:max-w-sm"
          >
            <Search className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate text-left">
              <span className="xl:hidden">Search options</span>
              <span className="hidden xl:inline">Search {allOptions.length} options</span>
            </span>
            <Kbd variant="hint">⌘K</Kbd>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <IconAction label="Search settings">
              <Button variant="ghost" size="icon" onClick={openCommandSearch} aria-label="Search settings" className="md:hidden">
                <Search />
              </Button>
            </IconAction>

            {modifiedCount > 0 && (
              <span className="mr-1 hidden h-7 items-center gap-1.5 rounded-full bg-accent px-2.5 text-xs font-medium text-accent-foreground sm:inline-flex">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                {modifiedCount} modified
              </span>
            )}

            <IconAction label="Undo">
              <Button variant="ghost" size="icon" onClick={handleUndo} aria-label="Undo" disabled={!canUndo} className="md:size-8">
                <Undo2 />
              </Button>
            </IconAction>
            <IconAction label="Redo">
              <Button variant="ghost" size="icon" onClick={handleRedo} aria-label="Redo" disabled={!canRedo} className="md:size-8">
                <Redo2 />
              </Button>
            </IconAction>

            <div className="mx-1.5 hidden h-5 w-px bg-border xl:block" aria-hidden="true" />

            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => openPresets(event.currentTarget)}
              aria-label="Configuration presets"
              className="hidden xl:inline-flex"
            >
              <Layers />
              Presets
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden xl:inline-flex">
              <Link href="/themes" aria-label="Browse themes">
                <Palette />
                Themes
              </Link>
            </Button>

            <div className="mx-1.5 hidden h-5 w-px bg-border xl:block" aria-hidden="true" />

            <Button
              ref={importButtonRef}
              variant="outline"
              size="sm"
              onClick={handleImport}
              aria-label="Import config"
              className="hidden xl:inline-flex"
            >
              {transientIcon(importState, <FileUp />)}
              Import
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              aria-label="Export config"
              className="ml-1 hidden md:inline-flex"
            >
              {transientIcon(exportState, <Download />)}
              Export
            </Button>

            {/* Non-modal: the page stays in the accessibility tree and scrollable while it is open. */}
            <DropdownMenu modal={false}>
              <IconAction label="More actions">
                <DropdownMenuTrigger asChild>
                  <Button ref={moreButtonRef} variant="ghost" size="icon" aria-label="More actions" className="ml-1 md:size-8">
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
              </IconAction>
              <DropdownMenuContent align="end">
                {!isWide && (
                  <>
                    <DropdownMenuItem onSelect={() => openPresets(moreButtonRef.current)}>
                      <Layers />
                      Presets
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/themes">
                        <Palette />
                        Browse themes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleImport}>
                      <FileUp />
                      Import config…
                    </DropdownMenuItem>
                    {!isTablet && (
                      <DropdownMenuItem onSelect={handleExport}>
                        <Download />
                        Export config
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <a href={GHOSTTY_DOCS_URL} target="_blank" rel="noopener noreferrer">
                    <BookOpen />
                    <span className="flex-1">Ghostty docs</span>
                    <ArrowUpRight className="size-3.5" />
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                    <GitBranch />
                    <span className="flex-1">Source on GitHub</span>
                    <ArrowUpRight className="size-3.5" />
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={resetAll} disabled={modifiedCount === 0}>
                  <RotateCcw />
                  Reset all settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </TooltipProvider>

      <PresetsDialog
        trigger={null}
        open={presetsOpen}
        onOpenChange={setPresetsOpen}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          presetsReturnRef.current?.focus();
        }}
      />

      {pendingImport && (
        <ImportReviewDialog
          open
          fileName={pendingImport.fileName}
          fileSize={pendingImport.fileSize}
          currentSettingCount={pendingImport.currentSettingCount}
          analysis={pendingImport.analysis}
          onOpenChange={(open) => {
            if (!open) closeImportReview();
          }}
          onConfirm={handleConfirmImport}
        />
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {importStatusMessage}
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {historyMessage}
      </p>
      {importErrorMessage && (
        <p className="sr-only" role="alert">
          {importErrorMessage}
        </p>
      )}
    </header>
  );
}
