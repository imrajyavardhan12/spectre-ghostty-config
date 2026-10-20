"use client";

import { useState } from "react";
import { Copy, Check, Code, Download, FileText, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfigStore } from "@/lib/store/config-store";
import { downloadConfigFile } from "@/lib/utils/download-config";
import { generateShareUrl } from "@/lib/utils/url-share";
import { cn } from "@/lib/utils";

/** Copy, download and share the generated file. `compact` is the docked pane's header version. */
export function ConfigActions({ compact = false }: { compact?: boolean }) {
  const config = useConfigStore((state) => state.config);
  const appliedTheme = useConfigStore((state) => state.appliedTheme);
  const exportConfig = useConfigStore((state) => state.exportConfig);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Controlled tooltip states to fix Firefox tooltip stuck issue
  const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);
  const [downloadTooltipOpen, setDownloadTooltipOpen] = useState(false);
  const [shareTooltipOpen, setShareTooltipOpen] = useState(false);

  const modifiedCount = Object.keys(config).length;

  const handleCopy = async () => {
    setCopyTooltipOpen(false);
    await navigator.clipboard.writeText(exportConfig());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    setDownloadTooltipOpen(false);
    downloadConfigFile(exportConfig());
  };

  const handleShare = async () => {
    setShareTooltipOpen(false);
    const shareUrl = generateShareUrl(config, appliedTheme);
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // In the pane header only Copy keeps its word; Download and Share are icons with names.
  const iconSize = compact ? "size-3.5" : "size-4";

  return (
    <>
      <Tooltip open={copyTooltipOpen} onOpenChange={setCopyTooltipOpen}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            // On a phone the pane header has no room for the word.
            aria-label={compact ? (copied ? "Copied!" : "Copy") : undefined}
            className={cn("gap-2", !compact && "flex-1 sm:flex-none")}
          >
            {copied ? (
              <>
                <Check className={cn(iconSize, "text-success")} />
                <span className={cn(compact && "max-sm:hidden")}>Copied!</span>
              </>
            ) : (
              <>
                <Copy className={iconSize} />
                <span className={cn(compact && "max-sm:hidden")}>Copy</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy config to clipboard</TooltipContent>
      </Tooltip>

      <Tooltip open={downloadTooltipOpen} onOpenChange={setDownloadTooltipOpen}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size={compact ? "icon-sm" : "sm"}
            onClick={handleDownload}
            aria-label={compact ? "Download" : undefined}
            className={cn("gap-2", !compact && "flex-1 sm:flex-none")}
          >
            <Download className={iconSize} />
            {!compact && "Download"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Download as config file</TooltipContent>
      </Tooltip>

      <Tooltip open={shareTooltipOpen} onOpenChange={setShareTooltipOpen}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size={compact ? "icon-sm" : "sm"}
            onClick={handleShare}
            disabled={modifiedCount === 0}
            aria-label={compact ? (linkCopied ? "Link Copied!" : "Share") : undefined}
            className={cn("gap-2", !compact && "flex-1 sm:flex-none")}
          >
            {linkCopied ? (
              <>
                <Check className={cn(iconSize, "text-success")} />
                {!compact && "Link Copied!"}
              </>
            ) : (
              <>
                <Share2 className={iconSize} />
                {!compact && "Share"}
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {modifiedCount === 0 ? "Add some settings to share" : "Copy shareable link"}
        </TooltipContent>
      </Tooltip>
    </>
  );
}

/** The generated file with line numbers; the sheet and the editor's preview pane both show it. */
export function ConfigFileContent({ showActions = true }: { showActions?: boolean }) {
  const config = useConfigStore((state) => state.config);
  const exportConfig = useConfigStore((state) => state.exportConfig);

  const configString = exportConfig();
  const modifiedCount = Object.keys(config).length;
  const lines = configString.split("\n");

  return (
    <>
      {showActions && (
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-6 py-3">
          <ConfigActions />
        </div>
      )}

      {/* Plain overflow, so a long line (a keybind, a shader path) scrolls sideways instead of clipping. */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Generated config"
        className="min-h-0 flex-1 overflow-auto bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        {modifiedCount > 0 ? (
          <pre className="min-w-max py-3.5 font-mono text-[12.5px] leading-[1.75]">
            {lines.map((line, i) => {
              const eq = line.indexOf("=");
              return (
                <div key={i} className="flex pr-4">
                  <span
                    aria-hidden="true"
                    className="w-11 shrink-0 pr-3.5 text-right text-subtle-foreground select-none"
                  >
                    {i + 1}
                  </span>
                  {line.startsWith("#") ? (
                    <span className="whitespace-pre text-muted-foreground">{line}</span>
                  ) : eq >= 0 ? (
                    <span className="whitespace-pre">
                      <span className="text-foreground">{line.slice(0, eq)}</span>
                      <span className="text-subtle-foreground">=</span>
                      <span className="text-accent-foreground">{line.slice(eq + 1)}</span>
                    </span>
                  ) : (
                    <span className="whitespace-pre">{line || "\u00A0"}</span>
                  )}
                </div>
              );
            })}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
              <Code className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No modifications yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Change some settings to see your config</p>
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        Save to <code className="font-mono text-foreground">~/.config/ghostty/config</code>
      </div>
    </>
  );
}

interface ConfigOutputProps {
  /** Open the config somewhere else (the docked pane) instead of this sheet. */
  onOpen?: () => void;
}

export function ConfigOutput({ onOpen }: ConfigOutputProps = {}) {
  const config = useConfigStore((state) => state.config);
  const [isOpen, setIsOpen] = useState(false);
  const modifiedCount = Object.keys(config).length;

  const trigger = (
    <Button variant="ghost" aria-label="View Config" onClick={onOpen} className="h-9 gap-2 px-3.5">
      <Code className="size-4" />
      <span className="hidden sm:inline">Config</span>
      {modifiedCount > 0 && (
        <span className="font-mono text-[11px] font-medium text-accent-foreground">{modifiedCount}</span>
      )}
    </Button>
  );

  if (onOpen) return trigger;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 h-full max-h-screen">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generated Config
          </SheetTitle>
          <SheetDescription>
            Copy, download, or share your Ghostty configuration
          </SheetDescription>
        </SheetHeader>

        <ConfigFileContent />
      </SheetContent>
    </Sheet>
  );
}
