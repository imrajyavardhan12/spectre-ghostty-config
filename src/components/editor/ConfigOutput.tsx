"use client";

import { useState } from "react";
import { Copy, Check, Code } from "lucide-react";
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

// We need to add sheet component
export function ConfigOutput() {
  const { exportConfig, config } = useConfigStore();
  const [copied, setCopied] = useState(false);

  const configString = exportConfig();
  const modifiedCount = Object.keys(config).length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(configString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Code className="h-4 w-4" />
          <span className="hidden sm:inline">View Config</span>
          {modifiedCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {modifiedCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Generated Config</SheetTitle>
          <SheetDescription>
            Copy this to your Ghostty config file
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>

        <ScrollArea className="mt-4 h-[calc(100vh-12rem)] rounded-md border bg-muted/50">
          <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words">
            {configString || "# No modifications yet"}
          </pre>
        </ScrollArea>

        <div className="mt-4 text-xs text-muted-foreground">
          <p>
            Save this to{" "}
            <code className="rounded bg-muted px-1">
              ~/.config/ghostty/config
            </code>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
