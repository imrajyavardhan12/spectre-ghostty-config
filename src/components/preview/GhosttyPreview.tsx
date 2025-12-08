"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Minimize2, Maximize2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfigStore } from "@/lib/store/config-store";
import { initGhostty } from "@/lib/ghostty/init";
import {
  mapConfigToTerminalOptions,
  mapConfigToTheme,
  getDefaultTheme,
} from "@/lib/ghostty/config-mapper";
import { generateDemoContent } from "@/lib/ghostty/demo-content";
import { cn } from "@/lib/utils";
import { detectClientOS, type ClientOS } from "@/lib/platform";
import type { Terminal as GhosttyTerminal } from "ghostty-web";

interface GhosttyPreviewProps {
  isOpen: boolean;
  onToggle: () => void;
}

type LoadingState = "idle" | "loading" | "ready" | "error";

const DEBOUNCE_MS = 300;

export function GhosttyPreview({ isOpen, onToggle }: GhosttyPreviewProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [clientOS] = useState<ClientOS>(() => detectClientOS());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<GhosttyTerminal | null>(null);
  const fitAddonRef = useRef<{ fit: () => void; dispose: () => void } | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const configVersionRef = useRef(0);
  
  // Use selectors to properly subscribe to config changes
  const config = useConfigStore((state) => state.config);
  const appliedTheme = useConfigStore((state) => state.appliedTheme);

  const writeContent = useCallback(() => {
    if (!terminalRef.current) return;
    const term = terminalRef.current;
    term.write("\x1bc");
    term.write(generateDemoContent(appliedTheme, clientOS));
    if (fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 10);
    }
  }, [appliedTheme, clientOS]);

  const disposeTerminal = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.dispose();
      terminalRef.current = null;
    }
    if (fitAddonRef.current) {
      fitAddonRef.current.dispose();
      fitAddonRef.current = null;
    }
    // Clear the container
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  }, []);

  const createTerminal = useCallback(async (showLoading = true) => {
    if (!containerRef.current) return;

    if (showLoading) {
      setLoadingState("loading");
    }
    setError(null);

    try {
      await initGhostty();

      const { Terminal, FitAddon } = await import("ghostty-web");

      // Dispose existing terminal first
      disposeTerminal();

      const options = mapConfigToTerminalOptions(config);
      const defaultTheme = getDefaultTheme();
      const userTheme = mapConfigToTheme(config);

      options.theme = { ...defaultTheme, ...userTheme };

      const term = new Terminal(options);
      const fitAddon = new FitAddon();

      term.loadAddon(fitAddon);
      term.open(containerRef.current);

      terminalRef.current = term;
      fitAddonRef.current = fitAddon;
      isInitializedRef.current = true;
      
      setTimeout(() => {
        fitAddon.fit();
        writeContent();
      }, 50);

      setLoadingState("ready");
    } catch (err) {
      console.error("Failed to initialize Ghostty preview:", err);
      setError(err instanceof Error ? err.message : "Failed to load preview");
      setLoadingState("error");
    }
  }, [config, writeContent, disposeTerminal]);

  // Initial terminal creation when preview opens
  useEffect(() => {
    if (isOpen && loadingState === "idle") {
      createTerminal(true);
    }
  }, [isOpen, loadingState, createTerminal]);

  // Debounced recreation when config changes (after initial load)
  useEffect(() => {
    // Skip if not open or not yet initialized
    if (!isOpen || !isInitializedRef.current || loadingState !== "ready") {
      return;
    }

    // Increment config version
    configVersionRef.current += 1;
    const currentVersion = configVersionRef.current;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the terminal recreation
    debounceTimerRef.current = setTimeout(() => {
      // Only recreate if this is still the latest config version
      if (currentVersion === configVersionRef.current) {
        createTerminal(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [config, appliedTheme, isOpen, loadingState, createTerminal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      disposeTerminal();
    };
  }, [disposeTerminal]);

  // Reset terminal when closing so it reinitializes on reopen
  useEffect(() => {
    if (!isOpen && isInitializedRef.current) {
      disposeTerminal();
      setLoadingState("idle");
      isInitializedRef.current = false;
      configVersionRef.current = 0;
    }
  }, [isOpen, disposeTerminal]);

  // Handle window resize
  useEffect(() => {
    if (!isOpen || isMinimized || loadingState !== "ready") return;

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, isMinimized, loadingState]);

  // Re-fit terminal when unminimizing
  useEffect(() => {
    if (!isMinimized && loadingState === "ready" && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 50);
    }
  }, [isMinimized, loadingState]);

  if (!isOpen) return null;

  const background = (config["background"] as string) || "#1a1b26";
  const foreground = (config["foreground"] as string) || "#c0caf5";
  const backgroundOpacity = (config["background-opacity"] as number) ?? 1;
  const isGtkDecoration = clientOS === "linux";

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300 ease-out",
        isMinimized
          ? "bottom-6 right-6 w-auto"
          : "bottom-6 right-6 w-[800px] max-w-[calc(100vw-3rem)]"
      )}
    >
      <div
        className={cn(
          "rounded-xl border border-border shadow-2xl overflow-hidden transition-all duration-300",
          isMinimized && "w-auto"
        )}
        style={{
          backgroundColor: background,
          opacity: backgroundOpacity,
        }}
      >
        {/* Window chrome */}
        <div
          className="flex items-center justify-between px-3 py-2.5 border-b border-white/10"
          style={{ backgroundColor: `${background}dd` }}
        >
          {isGtkDecoration ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: foreground }}>
                  Ghostty Preview
                  {loadingState === "loading" && " (Loading...)"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  aria-label="Minimize preview"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-7 w-7 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                  <Minimize2 className="h-3.5 w-3.5" style={{ color: foreground }} />
                </button>
                <button
                  aria-label="Restore preview"
                  onClick={() => setIsMinimized(false)}
                  className="h-7 w-7 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                  <Maximize2 className="h-3.5 w-3.5" style={{ color: foreground }} />
                </button>
                <button
                  aria-label="Close preview"
                  onClick={onToggle}
                  className="h-7 w-7 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                  <span className="text-sm" style={{ color: foreground }}>
                    ×
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="flex gap-2 group/buttons">
                  <button
                    onClick={onToggle}
                    className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors flex items-center justify-center"
                  >
                    <span className="opacity-0 group-hover/buttons:opacity-100 text-[8px] font-bold text-black/60 transition-opacity">
                      ×
                    </span>
                  </button>
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="w-3.5 h-3.5 rounded-full bg-[#febc2e] hover:bg-[#febc2e]/80 transition-colors flex items-center justify-center"
                  >
                    <span
                      className="opacity-0 group-hover/buttons:opacity-100 text-[10px] font-bold text-black/60 transition-opacity leading-none"
                      style={{ marginTop: "-1px" }}
                    >
                      −
                    </span>
                  </button>
                  <button
                    onClick={() => setIsMinimized(false)}
                    className="w-3.5 h-3.5 rounded-full bg-[#28c840] hover:bg-[#28c840]/80 transition-colors flex items-center justify-center"
                  >
                    <span className="opacity-0 group-hover/buttons:opacity-100 text-[8px] font-bold text-black/60 transition-opacity">
                      +
                    </span>
                  </button>
                </div>
                <span className="text-xs opacity-60 ml-2" style={{ color: foreground }}>
                  Ghostty Preview
                  {loadingState === "loading" && " (Loading...)"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-white/10"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? (
                    <Maximize2 className="h-3 w-3" style={{ color: foreground }} />
                  ) : (
                    <Minimize2 className="h-3 w-3" style={{ color: foreground }} />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Terminal content */}
        <div
          className={cn("relative", isMinimized && "hidden")}
          style={{
            height: "550px",
            backgroundColor: background,
          }}
        >
          {loadingState === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2
                  className="h-8 w-8 animate-spin"
                  style={{ color: foreground }}
                />
                <span className="text-sm" style={{ color: foreground }}>
                  Loading Ghostty WASM...
                </span>
              </div>
            </div>
          )}

          {loadingState === "error" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <span className="text-sm" style={{ color: foreground }}>
                  Failed to load preview
                </span>
                <span className="text-xs opacity-60" style={{ color: foreground }}>
                  {error}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoadingState("idle");
                    createTerminal(true);
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          <div
            ref={containerRef}
            className={cn(
              "w-full h-full",
              loadingState !== "ready" && "invisible"
            )}
            style={{ padding: "8px" }}
          />
        </div>
      </div>
    </div>
  );
}
