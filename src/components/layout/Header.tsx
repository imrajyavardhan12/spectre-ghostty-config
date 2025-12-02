"use client";

import Link from "next/link";
import { useState } from "react";
import { Ghost, Github, Download, Upload, RotateCcw, Check, Loader2, Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfigStore } from "@/lib/store/config-store";
import { PresetsDialog } from "@/components/editor/PresetsDialog";
import { cn } from "@/lib/utils";

export function Header() {
  const { exportConfig, resetAll, config } = useConfigStore();
  const modifiedCount = Object.keys(config).length;
  const [exportState, setExportState] = useState<"idle" | "loading" | "success">("idle");
  const [importState, setImportState] = useState<"idle" | "loading" | "success">("idle");

  const handleExport = async () => {
    setExportState("loading");
    
    // Simulate slight delay for feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const configString = exportConfig();
    const blob = new Blob([configString], { type: "text/plain" });
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
    input.accept = ".txt,.config,*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setImportState("loading");
        const text = await file.text();
        useConfigStore.getState().importConfig(text);
        setImportState("success");
        setTimeout(() => setImportState("idle"), 2000);
      }
    };
    input.click();
  };

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/50">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Ghost className="h-6 w-6 text-primary transition-transform duration-150 group-hover:rotate-12" />
          <span className="font-medium">Spectre</span>
          <span className="text-sm text-muted-foreground hidden lg:inline">
            Ghostty Config Generator
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
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
                  variant="ghost" 
                  size="icon" 
                  onClick={handleImport}
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
          <PresetsDialog
            trigger={
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Sparkles className="h-4 w-4" />
              </Button>
            }
          />

          {/* Themes */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                  <Link href="/themes">
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
                  >
                    <Github className="h-4 w-4" />
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
    </header>
  );
}
