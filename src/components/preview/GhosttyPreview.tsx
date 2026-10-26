"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Loader2, MonitorX, RefreshCw, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfigStore } from "@/lib/store/config-store";
import { initGhostty } from "@/lib/ghostty/init";
import {
  mapConfigToTerminalOptions,
  mapConfigToTheme,
  getDefaultTheme,
} from "@/lib/ghostty/config-mapper";
import { generateDemoContent, isCompactDemoWidth } from "@/lib/ghostty/demo-content";
import { mergePreviewTheme } from "@/lib/ghostty/preview-theme";
import { usePreviewTheme } from "./use-preview-theme";
import { cn } from "@/lib/utils";
import { detectClientOS, type ClientOS } from "@/lib/platform";
import type { ITerminalAddon, Terminal as GhosttyTerminal } from "ghostty-web";

interface GhosttyPreviewProps {
  isOpen: boolean;
  /** Offered beside Retry when the preview can't start, so the config is one click away. */
  onViewConfig?: () => void;
}

type LoadingState = "idle" | "loading" | "ready" | "error";
type FitAddonLike = ITerminalAddon & { fit: () => void };

// ghostty-web ignores fit() for 50 ms after a resize; wait a little longer before the last one.
const FIT_SETTLE_MS = 60;
const DEBOUNCE_MS = 300;

export function GhosttyPreview({ isOpen, onViewConfig }: GhosttyPreviewProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [clientOS] = useState<ClientOS>(() => detectClientOS());
  const [gridSize, setGridSize] = useState<{ cols: number; rows: number } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<GhosttyTerminal | null>(null);
  const fitAddonRef = useRef<FitAddonLike | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const creationRequestRef = useRef(0);
  const isInitializedRef = useRef(false);
  const configVersionRef = useRef(0);
  
  // Use selectors to properly subscribe to config changes
  const storeConfig = useConfigStore((state) => state.config);
  const appliedThemeName = useConfigStore((state) => state.appliedTheme);
  // Ghostty's `theme` option, resolved for the preview only.
  const previewTheme = usePreviewTheme(storeConfig.theme);
  const config = useMemo(
    () => mergePreviewTheme(storeConfig, previewTheme.themeConfig),
    [storeConfig, previewTheme.themeConfig]
  );
  // Label shown in the demo: a theme applied from the browser, else `theme`.
  const appliedTheme = appliedThemeName ?? previewTheme.themeName;
  const configRef = useRef(config);
  const appliedThemeRef = useRef(appliedTheme);
  const lastCreatedConfigRef = useRef<typeof config | null>(null);
  const lastCreatedThemeRef = useRef<string | null>(null);
  // Which sample layout is on screen, so a resize across the width threshold can swap it.
  const writtenCompactRef = useRef<boolean | null>(null);
  configRef.current = config;
  appliedThemeRef.current = appliedTheme;

  // Fit the terminal to its box, then report the grid it ended up with.
  const fitAndMeasure = useCallback((fitAddon: FitAddonLike | null) => {
    fitAddon?.fit();
    const term = terminalRef.current;
    if (!term || typeof term.cols !== "number" || typeof term.rows !== "number") return;
    const { cols, rows } = term;
    setGridSize((prev) => (prev?.cols === cols && prev.rows === rows ? prev : { cols, rows }));
  }, []);

  const writeContent = useCallback(
    (term: GhosttyTerminal, fitAddon: FitAddonLike) => {
      if (terminalRef.current !== term || fitAddonRef.current !== fitAddon) return;

      term.write("\x1bc");
      term.write(generateDemoContent(appliedThemeRef.current, clientOS, term.cols));
      writtenCompactRef.current = isCompactDemoWidth(term.cols);

      if (fitTimerRef.current) {
        clearTimeout(fitTimerRef.current);
      }
      fitTimerRef.current = setTimeout(() => {
        if (terminalRef.current === term && fitAddonRef.current === fitAddon) {
          fitAndMeasure(fitAddon);
        }
      }, 10);
    },
    [clientOS, fitAndMeasure]
  );

  const disposeTerminal = useCallback(() => {
    if (fitTimerRef.current) {
      clearTimeout(fitTimerRef.current);
      fitTimerRef.current = null;
    }
    writtenCompactRef.current = null;
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
    if (!containerRef.current || !isOpen) return;

    const requestId = ++creationRequestRef.current;
    const isCurrentRequest = () =>
      requestId === creationRequestRef.current &&
      isOpen &&
      containerRef.current !== null;

    if (showLoading) {
      setLoadingState("loading");
      setGridSize(null);
    }
    setError(null);

    let createdTerm: GhosttyTerminal | null = null;
    let createdFitAddon: FitAddonLike | null = null;
    const disposeCreatedResources = () => {
      const term = createdTerm;
      const fitAddon = createdFitAddon;
      createdTerm = null;
      createdFitAddon = null;
      term?.dispose();
      fitAddon?.dispose();
    };

    try {
      const ghostty = await initGhostty();
      if (!isCurrentRequest()) return;

      const { Terminal, FitAddon } = await import("ghostty-web");
      if (!isCurrentRequest()) return;

      // Dispose existing terminal first. A request id prevents an older
      // in-flight initialization from attaching itself after a close or a
      // newer config change.
      disposeTerminal();

      const configForTerminal = configRef.current;
      const options = mapConfigToTerminalOptions(configForTerminal);
      const defaultTheme = getDefaultTheme();
      const userTheme = mapConfigToTheme(configForTerminal);

      options.theme = { ...defaultTheme, ...userTheme };

      createdTerm = new Terminal({ ...options, ghostty });
      createdFitAddon = new FitAddon();

      createdTerm.loadAddon(createdFitAddon);
      const container = containerRef.current;
      if (!container || !isCurrentRequest()) {
        disposeCreatedResources();
        return;
      }
      // ghostty-web's open() ends with this.focus(). The preview is created and
      // re-created while the user edits settings, so that would move keyboard
      // focus out of the field they're typing in. Suppress it for open() only;
      // clicking the terminal still focuses it directly.
      const term = createdTerm;
      Object.defineProperty(term, "focus", { value: () => {}, configurable: true });
      try {
        term.open(container);
      } finally {
        delete (term as { focus?: unknown }).focus;
      }

      if (!isCurrentRequest()) {
        disposeCreatedResources();
        return;
      }

      terminalRef.current = createdTerm;
      fitAddonRef.current = createdFitAddon;
      isInitializedRef.current = true;
      lastCreatedConfigRef.current = configForTerminal;
      lastCreatedThemeRef.current = appliedThemeRef.current;

      setTimeout(() => {
        if (!isCurrentRequest() || terminalRef.current !== createdTerm) return;
        fitAndMeasure(createdFitAddon);
        if (createdTerm && createdFitAddon) {
          writeContent(createdTerm, createdFitAddon);
        }
      }, 50);

      setLoadingState("ready");
    } catch (err) {
      // A stale request may have been invalidated by closing the preview or
      // starting another initialization. It must not overwrite the current
      // UI state, but any locally-created resources still need cleanup.
      if (!isCurrentRequest()) {
        disposeCreatedResources();
        return;
      }

      disposeCreatedResources();
      setGridSize(null);
      console.error("Failed to initialize Ghostty preview:", err);
      setError(err instanceof Error ? err.message : "Failed to load preview");
      setLoadingState("error");
    }
  }, [disposeTerminal, fitAndMeasure, isOpen, writeContent]);

  // Initial terminal creation when preview opens
  useEffect(() => {
    if (isOpen && loadingState === "idle") {
      createTerminal(true);
    }
  }, [isOpen, loadingState, createTerminal]);

  // Debounced recreation when config changes (after initial load)
  useEffect(() => {
    // Skip if not open or not yet initialized. Comparing against the last
    // successful creation also avoids recreating the terminal merely because
    // the initial loading state changed to ready.
    if (
      !isOpen ||
      !isInitializedRef.current ||
      loadingState !== "ready" ||
      (lastCreatedConfigRef.current === configRef.current &&
        lastCreatedThemeRef.current === appliedThemeRef.current)
    ) {
      return;
    }

    configVersionRef.current += 1;
    const currentVersion = configVersionRef.current;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Only recreate if this is still the latest config version and the
      // pending request is not already current.
      if (
        currentVersion === configVersionRef.current &&
        (lastCreatedConfigRef.current !== configRef.current ||
          lastCreatedThemeRef.current !== appliedThemeRef.current)
      ) {
        void createTerminal(false);
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
      creationRequestRef.current += 1;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      disposeTerminal();
    };
  }, [disposeTerminal]);

  // Reset terminal when closing so it reinitializes on reopen. Invalidate
  // pending initialization before disposing, otherwise a late WASM import
  // could attach a terminal to a container that is no longer mounted.
  useEffect(() => {
    if (!isOpen) {
      creationRequestRef.current += 1;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      disposeTerminal();
      setLoadingState("idle");
      setGridSize(null);
      isInitializedRef.current = false;
      configVersionRef.current = 0;
      lastCreatedConfigRef.current = null;
      lastCreatedThemeRef.current = null;
    }
  }, [isOpen, disposeTerminal]);

  // Refit whenever the terminal's box changes size: window resizes, and the
  // pane opening, collapsing, or changing width.
  useEffect(() => {
    const container = containerRef.current;
    if (!isOpen || loadingState !== "ready" || !container) return;

    const refit = () => {
      const fitAddon = fitAddonRef.current;
      fitAndMeasure(fitAddon);
      // The sample is laid out for the width it was written at. Rewrite it when
      // a resize crosses the narrow/wide threshold.
      const term = terminalRef.current;
      const written = writtenCompactRef.current;
      if (term && fitAddon && written !== null && isCompactDemoWidth(term.cols) !== written) {
        writeContent(term, fitAddon);
      }
    };
    // ghostty-web's fit() does nothing for 50 ms after a resize, so a resize that
    // lands inside that window would never be applied. Refit once more after it.
    let trailingRefit: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      refit();
      clearTimeout(trailingRefit);
      trailingRefit = setTimeout(refit, FIT_SETTLE_MS);
    });
    observer.observe(container);
    return () => {
      clearTimeout(trailingRefit);
      observer.disconnect();
    };
  }, [isOpen, loadingState, fitAndMeasure, writeContent]);

  if (!isOpen) return null;

  const background = (config["background"] as string) || "#1a1b26";
  const foreground = (config["foreground"] as string) || "#c0caf5";
  const backgroundOpacity = (config["background-opacity"] as number) ?? 1;
  const isGtkDecoration = clientOS === "linux";

  return (
    <div className="flex h-full w-full flex-col gap-2.5">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border transition-all duration-300"
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
          <div className="flex w-full items-center gap-2">
            {!isGtkDecoration && (
              <div className="flex gap-1.5" aria-hidden="true">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="size-[9px] rounded-full"
                    style={{ backgroundColor: foreground, opacity: 0.25 }}
                  />
                ))}
              </div>
            )}
            <span className={cn("text-xs", !isGtkDecoration && "ml-1 opacity-60")} style={{ color: foreground }}>
              Ghostty Preview
            </span>
            <span className="flex-1" />
            {gridSize && (
              <span className="font-mono text-[11px] opacity-60" style={{ color: foreground }}>
                {gridSize.cols}×{gridSize.rows}
              </span>
            )}
          </div>
        </div>

        {/* Terminal content */}
        <div
          className="relative min-h-0 flex-1"
          style={{ backgroundColor: background }}
        >
          {loadingState === "ready" && previewTheme.status === "unavailable" && (
            <p
              role="status"
              className="absolute inset-x-3 bottom-2 z-10 text-[11px] opacity-70"
              style={{ color: foreground }}
            >
              {previewTheme.themeName
                ? `Theme "${previewTheme.themeName}" couldn't be loaded for the preview; showing your other colors.`
                : "Theme files on disk can't be previewed in the browser; showing your other colors."}
            </p>
          )}
          {loadingState === "loading" && (
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="absolute inset-0 z-10 flex flex-col gap-2.5 bg-card p-4 text-foreground"
            >
              {["46%", "68%", "38%"].map((width, i) => (
                <div
                  key={width}
                  aria-hidden="true"
                  className="h-2.5 rounded-[3px] bg-muted motion-safe:animate-pulse"
                  style={{ width, animationDelay: `${i * 150}ms` }}
                />
              ))}
              <div className="flex flex-1 flex-col items-center justify-center gap-2.5 text-center">
                <Loader2
                  aria-hidden="true"
                  className="size-5 text-muted-foreground motion-safe:animate-spin"
                />
                <p className="text-[13px]">Starting Ghostty…</p>
                <p className="text-xs text-muted-foreground">Loading the terminal engine. First run only.</p>
              </div>
            </div>
          )}

          {loadingState === "error" && (
            <div
              role="alert"
              aria-atomic="true"
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card p-6 text-center text-foreground"
            >
              <span className="grid size-10 place-items-center rounded-[10px] bg-destructive-soft text-destructive-foreground">
                <MonitorX aria-hidden="true" className="size-5" />
              </span>
              <p className="text-[15px] font-semibold">Preview couldn&apos;t start</p>
              <p className="max-w-[300px] text-[13px] leading-normal text-pretty text-muted-foreground">
                The terminal engine failed to load. Your settings are safe and the config is still up to date.
              </p>
              {error && <p className="font-mono text-[11px] text-subtle-foreground">{error}</p>}
              <div className="mt-1 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    void createTerminal(true);
                  }}
                >
                  <RefreshCw aria-hidden="true" className="size-3.5" />
                  Retry
                </Button>
                {onViewConfig && (
                  <Button variant="outline" size="sm" onClick={onViewConfig}>
                    View config
                  </Button>
                )}
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

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            loadingState === "ready" ? "bg-success" : loadingState === "error" ? "bg-destructive" : "bg-warning"
          )}
        />
        {loadingState === "ready"
          ? "Live — updates as you edit"
          : loadingState === "error"
            ? "Preview unavailable"
            : "Loading preview"}
        <span className="flex-1" />
        <span className="font-mono text-subtle-foreground">libghostty · wasm</span>
      </div>
    </div>
  );
}

// Opens the preview pane; it sits in the floating pill with the config button.
export function PreviewToggleButton({ onOpen }: { onOpen: () => void }) {
  return (
    <Button onClick={onOpen} aria-label="Open Preview" variant="ghost" className="h-9 gap-2 px-3.5">
      <Monitor className="size-4" />
      <span className="hidden sm:inline">Preview</span>
    </Button>
  );
}
