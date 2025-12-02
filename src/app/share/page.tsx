"use client";

import { useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Ghost, ArrowRight, Copy, Check, Download, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getConfigFromUrl } from "@/lib/utils/url-share";
import { useConfigStore } from "@/lib/store/config-store";

function SharePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  
  const { loadConfig, exportConfig } = useConfigStore();

  const { sharedConfig, error } = useMemo(() => {
    const config = getConfigFromUrl(searchParams);
    if (config) {
      loadConfig(config.config, config.theme ?? undefined);
      return { sharedConfig: config, error: null };
    } else if (searchParams.get("c")) {
      return { sharedConfig: null, error: "Invalid or corrupted share link" };
    } else {
      return { sharedConfig: null, error: "No configuration found in URL" };
    }
  }, [searchParams, loadConfig]);

  const configString = sharedConfig ? exportConfig() : "";
  const modifiedCount = sharedConfig ? Object.keys(sharedConfig.config).length : 0;

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

  const handleOpenInEditor = () => {
    router.push("/editor");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-border bg-background/95 backdrop-blur">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <Ghost className="h-6 w-6 text-primary transition-transform duration-150 group-hover:rotate-12" />
              <span className="font-medium">Spectre</span>
            </Link>
          </div>
        </nav>

        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-medium mb-2">Invalid Share Link</h1>
          <p className="text-muted-foreground mb-8 text-center max-w-md">
            {error}. The link may have been corrupted or is no longer valid.
          </p>
          <Button asChild>
            <Link href="/editor">
              Create New Config
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Ghost className="h-6 w-6 text-primary transition-transform duration-150 group-hover:rotate-12" />
            <span className="font-medium">Spectre</span>
          </Link>
          <Button asChild>
            <Link href="/editor">
              Open Editor
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        <div className="mb-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Ghost className="h-4 w-4" />
            <span>Shared Configuration</span>
          </div>
          
          <h1 className="text-3xl font-medium mb-2">
            {sharedConfig?.theme ? (
              <>Theme: {sharedConfig.theme}</>
            ) : (
              <>Custom Configuration</>
            )}
          </h1>
          <p className="text-muted-foreground">
            {modifiedCount} setting{modifiedCount !== 1 ? "s" : ""} configured
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8 animate-fade-up [animation-delay:0.1s] [animation-fill-mode:backwards]">
          <Button onClick={handleCopy} variant="outline" className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Config
              </>
            )}
          </Button>
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button onClick={handleOpenInEditor} className="gap-2">
            Open in Editor
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Config Preview */}
        <div className="rounded-xl border border-border overflow-hidden animate-fade-up [animation-delay:0.2s] [animation-fill-mode:backwards]">
          <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="flex-1 text-center text-xs text-muted-foreground font-mono">
              ~/.config/ghostty/config
            </span>
          </div>
          
          <div className="p-6 bg-card max-h-[500px] overflow-y-auto">
            <pre className="text-sm font-mono leading-relaxed">
              {configString.split('\n').map((line, i) => (
                <div 
                  key={i} 
                  className={
                    line.startsWith('#') 
                      ? "text-muted-foreground" 
                      : line.includes('=') 
                        ? "text-foreground" 
                        : ""
                  }
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
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Save this config to{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">
              ~/.config/ghostty/config
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SharePageContent />
    </Suspense>
  );
}
