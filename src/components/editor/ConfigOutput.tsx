"use client";

import { useState } from "react";
import { Copy, Check, Code, Download, FileText, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { generateShareUrl } from "@/lib/utils/url-share";
import { cn } from "@/lib/utils";

export function ConfigOutput() {
  const { exportConfig, config, appliedTheme } = useConfigStore();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Controlled tooltip states to fix Firefox tooltip stuck issue
  const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);
  const [downloadTooltipOpen, setDownloadTooltipOpen] = useState(false);
  const [shareTooltipOpen, setShareTooltipOpen] = useState(false);

  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Reset all tooltip states when sheet opens/closes to prevent stuck tooltips
    setCopyTooltipOpen(false);
    setDownloadTooltipOpen(false);
    setShareTooltipOpen(false);
  };

  const configString = exportConfig();
  const modifiedCount = Object.keys(config).length;

  const handleCopy = async () => {
    setCopyTooltipOpen(false);
    await navigator.clipboard.writeText(configString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    setDownloadTooltipOpen(false);
    const blob = new Blob([configString], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    setShareTooltipOpen(false);
    const shareUrl = generateShareUrl(config, appliedTheme);
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <Button 
          className={cn(
            "gap-2 shadow-lg transition-all duration-300",
            modifiedCount > 0 && "shadow-primary/20"
          )}
        >
          <Code className="h-4 w-4" />
          <span className="hidden sm:inline">View Config</span>
          {modifiedCount > 0 && (
            <span className="ml-1 min-w-5 h-5 flex items-center justify-center rounded-full bg-primary-foreground/20 text-xs font-medium">
              {modifiedCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
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

        {/* Action buttons */}
        <div className="flex items-center gap-2 px-6 py-3 bg-muted/30 border-b border-border">
          <Tooltip open={copyTooltipOpen} onOpenChange={setCopyTooltipOpen}>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopy}
                className="gap-2 flex-1 sm:flex-none"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
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
                size="sm" 
                onClick={handleDownload}
                className="gap-2 flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download as config file</TooltipContent>
          </Tooltip>

          <Tooltip open={shareTooltipOpen} onOpenChange={setShareTooltipOpen}>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShare}
                disabled={modifiedCount === 0}
                className="gap-2 flex-1 sm:flex-none"
              >
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Share
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {modifiedCount === 0 
                ? "Add some settings to share" 
                : "Copy shareable link"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Config content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4">
            {modifiedCount > 0 ? (
              <pre className="text-sm font-mono leading-relaxed">
                {configString.split('\n').map((line, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "py-0.5 transition-colors",
                      line.startsWith('#') 
                        ? "text-muted-foreground" 
                        : line.includes('=') 
                          ? "text-foreground" 
                          : ""
                    )}
                  >
                    {line.includes('=') ? (
                      <>
                        <span className="text-muted-foreground">
                          {line.split('=')[0]}
                        </span>
                        <span className="text-muted-foreground">=</span>
                        <span className="text-primary">
                          {line.split('=').slice(1).join('=')}
                        </span>
                      </>
                    ) : (
                      line || '\u00A0'
                    )}
                  </div>
                ))}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  No modifications yet
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Change some settings to see your config
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Save this file to{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">
              ~/.config/ghostty/config
            </code>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
