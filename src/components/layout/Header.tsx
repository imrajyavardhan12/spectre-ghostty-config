"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Ghost, Code2, Download, Upload, RotateCcw, Check, Loader2, Palette, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfigStore } from "@/lib/store/config-store";
import { ImportReviewDialog } from "@/components/editor/ImportReviewDialog";
import { PresetsDialog } from "@/components/editor/PresetsDialog";
import { cn } from "@/lib/utils";
import { analyzeGhosttyConfig } from "@/lib/utils/config-import-analysis";
import type { ImportAnalysis } from "@/lib/utils/config-import-analysis";
import type { ConfigValues } from "@/lib/schema/types";
import { SPECTRE_VERSION } from "@/lib/version";

interface PendingImport {
  fileName: string;
  fileSize: number;
  currentSettingCount: number;
  analysis: ImportAnalysis;
}

export function Header() {
  // Use selectors to properly subscribe to config changes
  const config = useConfigStore((state) => state.config);
  const exportConfig = useConfigStore((state) => state.exportConfig);
  const resetAll = useConfigStore((state) => state.resetAll);
  const modifiedCount = Object.keys(config).length;
  const [exportState, setExportState] = useState<"idle" | "loading" | "success">("idle");
  const [importState, setImportState] = useState<"idle" | "loading" | "success">("idle");
  const [importStatusMessage, setImportStatusMessage] = useState("");
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const importButtonRef = useRef<HTMLButtonElement>(null);

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
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setImportState("loading");
        try {
          const text = await file.text();
          setPendingImport({
            fileName: file.name,
            fileSize: file.size,
            currentSettingCount: Object.keys(useConfigStore.getState().config).length,
            analysis: analyzeGhosttyConfig(text),
          });
        } finally {
          setImportState("idle");
        }
      }
    };
    input.click();
  };

  const restoreImportFocus = () => {
    setTimeout(() => importButtonRef.current?.focus(), 0);
  };

  const closeImportReview = () => {
    setPendingImport(null);
    restoreImportFocus();
  };

  const handleConfirmImport = (candidate: ConfigValues) => {
    const resultingCount = pendingImport?.analysis.summary.resultingSettingCount ?? 0;
    useConfigStore.getState().applyImportedCandidate(candidate);
    setPendingImport(null);
    setImportState("success");
    setImportStatusMessage(
      resultingCount === 0
        ? "Imported configuration defaults."
        : `Imported ${resultingCount} ${resultingCount === 1 ? "setting" : "settings"}.`
    );
    restoreImportFocus();
    setTimeout(() => {
      setImportState("idle");
      setImportStatusMessage("");
    }, 2000);
  };

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/50">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Ghost className="h-6 w-6 text-primary transition-transform duration-150 group-hover:rotate-12" />
          <span className="font-medium">Spectre</span>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            v{SPECTRE_VERSION}
          </span>
          <span className="text-sm text-muted-foreground hidden lg:inline">
            Ghostty Config Generator
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Search button */}
          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 border border-border rounded-md hover:bg-muted transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          {/* Modified count badge */}
          {modifiedCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium animate-scale-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {modifiedCount} modified
            </div>
          )}

          {/* Import button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  ref={importButtonRef}
                  variant="ghost"
                  size="icon"
                  onClick={handleImport}
                  aria-label="Import Config"
                  className="relative h-9 w-9"
                >
                  {importState === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : importState === "success" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Import Config</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Export button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleExport}
                  aria-label="Export Config"
                  className="h-9 w-9"
                >
                  {exportState === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : exportState === "success" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Export Config</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Reset button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetAll}
                  aria-label="Reset All"
                  disabled={modifiedCount === 0}
                  className={cn(
                    "h-9 w-9 transition-all duration-200",
                    modifiedCount > 0 && "hover:bg-destructive/10 hover:text-destructive"
                  )}
                >
                  <RotateCcw className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    modifiedCount > 0 && "hover:-rotate-45"
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Reset All</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Divider */}
          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

          {/* Presets */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <PresetsDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Configuration Presets"
                        className="h-9 w-9"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    }
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Configuration Presets</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Themes */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                  <Link href="/themes" aria-label="Browse Themes">
                    <Palette className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Browse Themes</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* GitHub */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                  <a
                    href="https://github.com/imrajyavardhan12/spectre-ghostty-config"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View Spectre on GitHub"
                  >
                    <Code2 className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>View on GitHub</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

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
    </header>
  );
}
