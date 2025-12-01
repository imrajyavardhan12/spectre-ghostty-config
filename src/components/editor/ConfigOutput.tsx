"use client";

import { useState } from "react";
import { Copy, Check, Code, Download, FileText } from "lucide-react";
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
import { useConfigStore } from "@/lib/store/config-store";
import { cn } from "@/lib/utils";

export function ConfigOutput() {
  const { exportConfig, config } = useConfigStore();
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const configString = exportConfig();
  const modifiedCount = Object.keys(config).length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(configString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
      
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generated Config
          </SheetTitle>
          <SheetDescription>
            Copy or download your Ghostty configuration
          </SheetDescription>
        </SheetHeader>

        {/* Action buttons */}
        <div className="flex items-center gap-2 px-6 py-3 bg-muted/30 border-b border-border">
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            className="gap-2 flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>

        {/* Config content */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-4">
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
