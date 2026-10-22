"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { CloudOff, Loader2, Moon, RefreshCw, Search, SearchX, Sparkles, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeCard, ThemeCardSkeleton } from "./ThemeCard";
import { cn } from "@/lib/utils";
import {
  Theme,
  ThemeListItem,
  fetchThemeList,
  fetchTheme,
  categorizeTheme,
  FEATURED_THEMES,
  themeToConfig,
} from "@/lib/utils/themes";
import { THEME_CONFIG_KEYS } from "@/lib/utils/theme-config";
import { useConfigStore } from "@/lib/store/config-store";

type FilterType = "all" | "dark" | "light" | "featured";

const THEME_FETCH_CONCURRENCY = 6;
const SEARCH_LOAD_DEBOUNCE_MS = 200;

type ThemeLoadSource = "featured" | "filter" | "manual" | "search";
type ThemeLoadStatus = "queued" | "active";

interface ThemeLoadTask {
  name: string;
  priority: number;
  order: number;
  generation: number;
  status: ThemeLoadStatus;
  occupiesSlot: boolean;
  priorities: Map<ThemeLoadSource, number>;
  controller: AbortController;
  promise: Promise<void>;
  resolve: () => void;
}

const GRID_CLASS = "grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

const FILTER_LABELS: Record<FilterType, string> = {
  all: "all themes",
  featured: "featured themes",
  dark: "dark themes",
  light: "light themes",
};

interface ThemeBrowserProps {
  /** Called after a theme is written to the config. */
  onApplied?: (theme: Theme) => void;
}

export function ThemeBrowser({ onApplied }: ThemeBrowserProps = {}) {
  const [themeList, setThemeList] = useState<ThemeListItem[]>([]);
  const [loadedThemes, setLoadedThemes] = useState<Map<string, Theme>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumped by "Try again" to fetch the theme list once more without reloading the page.
  const [listAttempt, setListAttempt] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("featured");
  const [appliedTheme, setAppliedTheme] = useState<string | null>(null);
  const [failedThemeNames, setFailedThemeNames] = useState<Set<string>>(
    new Set()
  );
  const loadedThemesRef = useRef(loadedThemes);
  const pendingThemeLoadsRef = useRef(new Map<string, ThemeLoadTask>());
  const queuedThemeLoadsRef = useRef<ThemeLoadTask[]>([]);
  const activeThemeLoadsRef = useRef(0);
  const themeLoadOrderRef = useRef(0);
  const themeLoadGenerationRef = useRef(0);
  const searchPriorityRef = useRef(0);
  const drainThemeQueueRef = useRef<() => void>(() => undefined);
  const themeListAbortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  
  // Use selectors to properly subscribe to config changes
  const config = useConfigStore((state) => state.config);
  const loadConfig = useConfigStore((state) => state.loadConfig);

  const updateLoadingMore = useCallback(() => {
    if (isMountedRef.current) {
      setLoadingMore(pendingThemeLoadsRef.current.size > 0);
    }
  }, []);

  const releaseThemeLoadSlot = useCallback((task: ThemeLoadTask) => {
    if (!task.occupiesSlot) return;

    task.occupiesSlot = false;
    if (task.generation === themeLoadGenerationRef.current) {
      activeThemeLoadsRef.current = Math.max(
        0,
        activeThemeLoadsRef.current - 1
      );
    }
  }, []);

  const detachThemeLoad = useCallback(
    (task: ThemeLoadTask) => {
      if (pendingThemeLoadsRef.current.get(task.name) !== task) return;

      pendingThemeLoadsRef.current.delete(task.name);
      if (task.status === "queued") {
        queuedThemeLoadsRef.current = queuedThemeLoadsRef.current.filter(
          (queuedTask) => queuedTask !== task
        );
      }

      // Active tasks keep their concurrency slot until the fetch promise
      // settles. This prevents replacements from exceeding the global cap
      // while an aborted request is still winding down.
      task.controller.abort();
      task.resolve();
      updateLoadingMore();
    },
    [updateLoadingMore]
  );

  const drainThemeQueue = useCallback(() => {
    if (!isMountedRef.current) return;

    queuedThemeLoadsRef.current.sort(
      (a, b) => b.priority - a.priority || a.order - b.order
    );

    while (
      activeThemeLoadsRef.current < THEME_FETCH_CONCURRENCY &&
      queuedThemeLoadsRef.current.length > 0
    ) {
      const task = queuedThemeLoadsRef.current.shift();
      if (
        !task ||
        task.status !== "queued" ||
        pendingThemeLoadsRef.current.get(task.name) !== task
      ) {
        continue;
      }

      task.status = "active";
      task.occupiesSlot = true;
      activeThemeLoadsRef.current += 1;

      void fetchTheme(task.name, { signal: task.controller.signal })
        .then((theme) => {
          if (
            !isMountedRef.current ||
            task.controller.signal.aborted ||
            pendingThemeLoadsRef.current.get(task.name) !== task
          ) {
            return;
          }

          const next = new Map(loadedThemesRef.current);
          next.set(task.name, theme);
          loadedThemesRef.current = next;
          setLoadedThemes(next);
          setFailedThemeNames((prev) => {
            if (!prev.has(task.name)) return prev;
            const failures = new Set(prev);
            failures.delete(task.name);
            return failures;
          });
        })
        .catch((error: unknown) => {
          const wasAborted =
            task.controller.signal.aborted ||
            (error instanceof Error && error.name === "AbortError");
          if (
            wasAborted ||
            !isMountedRef.current ||
            pendingThemeLoadsRef.current.get(task.name) !== task
          ) {
            return;
          }

          setFailedThemeNames((prev) => {
            if (prev.has(task.name)) return prev;
            const failures = new Set(prev);
            failures.add(task.name);
            return failures;
          });
        })
        .finally(() => {
          releaseThemeLoadSlot(task);

          if (pendingThemeLoadsRef.current.get(task.name) === task) {
            pendingThemeLoadsRef.current.delete(task.name);
            task.resolve();
            updateLoadingMore();
          }

          drainThemeQueueRef.current();
        });
    }
  }, [releaseThemeLoadSlot, updateLoadingMore]);
  drainThemeQueueRef.current = drainThemeQueue;

  // Schedule per-theme work so overlapping UI requests share one fetch. Newer
  // searches receive a higher priority and can move already-queued names ahead
  // of stale work without discarding themes that have already loaded.
  const loadThemeBatch = useCallback(
    (
      names: string[],
      source: ThemeLoadSource,
      priority = 0
    ): Promise<void> => {
      const promises = [...new Set(names)].map((name) => {
        if (loadedThemesRef.current.has(name)) {
          return Promise.resolve();
        }

        const pendingTask = pendingThemeLoadsRef.current.get(name);
        if (pendingTask) {
          pendingTask.priorities.set(source, priority);
          pendingTask.priority = Math.max(...pendingTask.priorities.values());
          return pendingTask.promise;
        }

        let resolveTask: () => void = () => undefined;
        const promise = new Promise<void>((resolve) => {
          resolveTask = resolve;
        });
        const priorities = new Map<ThemeLoadSource, number>([[source, priority]]);
        const task: ThemeLoadTask = {
          name,
          priority,
          order: themeLoadOrderRef.current++,
          generation: themeLoadGenerationRef.current,
          status: "queued",
          occupiesSlot: false,
          priorities,
          controller: new AbortController(),
          promise,
          resolve: resolveTask,
        };

        pendingThemeLoadsRef.current.set(name, task);
        queuedThemeLoadsRef.current.push(task);
        return promise;
      });

      updateLoadingMore();
      drainThemeQueueRef.current();
      return Promise.all(promises).then(() => undefined);
    },
    [updateLoadingMore]
  );

  const releaseThemeLoadSource = useCallback(
    (source: ThemeLoadSource) => {
      for (const task of [...pendingThemeLoadsRef.current.values()]) {
        if (!task.priorities.delete(source)) continue;

        if (task.priorities.size === 0) {
          detachThemeLoad(task);
        } else {
          task.priority = Math.max(...task.priorities.values());
        }
      }

      drainThemeQueueRef.current();
    },
    [detachThemeLoad]
  );

  // Cancel list and theme requests when leaving the browser. Resolving queued
  // task promises also lets any awaiting effects finish without retaining the
  // unmounted component.
  useEffect(() => {
    isMountedRef.current = true;
    const controller = new AbortController();
    const pendingThemeLoads = pendingThemeLoadsRef.current;
    themeListAbortControllerRef.current = controller;

    return () => {
      isMountedRef.current = false;
      controller.abort();
      themeLoadGenerationRef.current += 1;
      for (const task of [...pendingThemeLoads.values()]) {
        detachThemeLoad(task);
      }
      queuedThemeLoadsRef.current = [];
      activeThemeLoadsRef.current = 0;
    };
  }, [detachThemeLoad]);

  // Fetch theme list on mount
  useEffect(() => {
    const signal = themeListAbortControllerRef.current?.signal;

    async function loadThemeList() {
      try {
        setLoading(true);
        const list = await fetchThemeList({ signal });
        if (!isMountedRef.current || signal?.aborted) return;
        setThemeList(list);
        
        // Load featured themes first
        const featuredNames = list
          .filter((t) => FEATURED_THEMES.includes(t.name))
          .map((t) => t.name)
          .slice(0, 12);
        
        await loadThemeBatch(featuredNames, "featured");
      } catch (err) {
        if (!isMountedRef.current || signal?.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load themes");
      } finally {
        if (isMountedRef.current && !signal?.aborted) {
          setLoading(false);
        }
      }
    }
    
    void loadThemeList();
  }, [loadThemeBatch, listAttempt]);

  const handleRetryList = () => {
    setError(null);
    setLoading(true);
    setListAttempt((attempt) => attempt + 1);
  };

  // Whitespace alone is not a search.
  const query = searchQuery.trim();

  // Filter and search themes
  const filteredThemes = useMemo(() => {
    let themes = Array.from(loadedThemes.values());

    // Apply search filter
    if (query) {
      const lowered = query.toLowerCase();
      themes = themes.filter((t) =>
        t.name.toLowerCase().includes(lowered)
      );
    }

    // Apply type filter
    if (filter === "dark") {
      themes = themes.filter((t) => categorizeTheme(t) === "dark");
    } else if (filter === "light") {
      themes = themes.filter((t) => categorizeTheme(t) === "light");
    } else if (filter === "featured" && !query) {
      // Searching should cover the complete upstream list even though the
      // browser defaults to Featured before the user enters a query.
      themes = themes.filter((t) => FEATURED_THEMES.includes(t.name));
    }

    // Sort: featured first, then alphabetically
    themes.sort((a, b) => {
      const aFeatured = FEATURED_THEMES.includes(a.name);
      const bFeatured = FEATURED_THEMES.includes(b.name);
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      return a.name.localeCompare(b.name);
    });

    return themes;
  }, [loadedThemes, query, filter]);

  // Auto-load all themes when a non-featured filter is selected. Switching
  // back to Featured releases filter-only work while retaining shared search
  // and manual requests.
  const shouldLoadAllForFilter = filter !== "featured";
  useEffect(() => {
    if (!shouldLoadAllForFilter) {
      releaseThemeLoadSource("filter");
      return;
    }

    if (themeList.length > 0) {
      void loadThemeBatch(
        themeList.map((theme) => theme.name),
        "filter"
      );
    }
  }, [shouldLoadAllForFilter, themeList, loadThemeBatch, releaseThemeLoadSource]);

  // Debounce search requests and immediately cancel queued or in-flight work
  // that was only needed by the previous query. A monotonically increasing
  // priority lets the latest query jump ahead of older shared work.
  useEffect(() => {
    releaseThemeLoadSource("search");
    if (!query) return;

    const priority = ++searchPriorityRef.current;
    const timeoutId = window.setTimeout(() => {
      const lowered = query.toLowerCase();
      const matchingNames = themeList
        .filter((theme) => theme.name.toLowerCase().includes(lowered))
        .map((theme) => theme.name)
        .slice(0, 20);

      void loadThemeBatch(matchingNames, "search", priority);
    }, SEARCH_LOAD_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [query, themeList, loadThemeBatch, releaseThemeLoadSource]);

  // Load all themes button
  const handleLoadAll = async () => {
    const allNames = themeList.map((t) => t.name);
    await loadThemeBatch(allNames, "manual");
  };

  const handleRetryFailedThemes = () => {
    const priority = ++searchPriorityRef.current;
    void loadThemeBatch([...failedThemeNames], "manual", priority);
  };

  // Apply theme
  const handleApplyTheme = (theme: Theme) => {
    const themeConfig = themeToConfig(theme);
    
    // Merge with existing config (keep non-theme settings)
    const newConfig = { ...config };
    
    // Remove old theme-derived settings
    THEME_CONFIG_KEYS.forEach((key) => {
      delete newConfig[key];
    });
    
    // Add new theme colors
    Object.assign(newConfig, themeConfig);
    
    // Pass theme name to store for export comment
    loadConfig(newConfig, theme.name);
    setAppliedTheme(theme.name);
    onApplied?.(theme);
  };

  const filterButtons: { value: FilterType; label: string; icon?: React.ReactNode }[] = [
    { value: "all", label: "All" },
    { value: "featured", label: "Featured", icon: <Sparkles className="size-3.5" aria-hidden="true" /> },
    { value: "dark", label: "Dark", icon: <Moon className="size-3.5" aria-hidden="true" /> },
    { value: "light", label: "Light", icon: <Sun className="size-3.5" aria-hidden="true" /> },
  ];

  const hasThemes = themeList.length > 0;
  const allLoaded = hasThemes && loadedThemes.size >= themeList.length;
  const canLoadMore = hasThemes && !allLoaded;
  const loadAllButton = (variant: "link" | "primary") => (
    <Button
      variant={variant === "link" ? "ghost" : "default"}
      size="sm"
      onClick={handleLoadAll}
      disabled={loadingMore}
      className={cn(variant === "link" && "h-7 px-2 text-primary hover:bg-accent hover:text-primary")}
    >
      {loadingMore ? (
        <>
          <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          Loading...
        </>
      ) : (
        "Load all themes"
      )}
    </Button>
  );


  if (error) {
    return (
      <div
        role="alert"
        className="mt-8 flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card px-6 py-16 text-center"
      >
        <span className="grid size-10 place-items-center rounded-[10px] bg-destructive-soft text-destructive-foreground">
          <CloudOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-[15px] font-semibold">Failed to load themes</p>
        <p className="max-w-[360px] text-[13px] leading-normal text-muted-foreground">
          The theme list couldn&apos;t be fetched. Check your connection and try again. Your editor
          settings aren&apos;t affected.
        </p>
        <p className="max-w-[360px] font-mono text-xs break-words text-subtle-foreground">{error}</p>
        <Button onClick={handleRetryList} className="mt-1.5">
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Search and filters */}
      <div className="mt-7 flex flex-wrap items-center gap-2.5">
        <div className="flex h-10 min-w-0 flex-[1_1_260px] items-center gap-2 rounded-[9px] border border-input bg-field px-3 focus-within:ring-2 focus-within:ring-ring">
          <Search className="size-4 shrink-0 text-subtle-foreground" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            aria-label="Search themes"
            placeholder="Search themes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-full min-w-0 flex-1 appearance-none bg-transparent text-sm outline-none placeholder:text-subtle-foreground [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
              className="grid size-7 shrink-0 place-items-center rounded-md text-subtle-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          className="flex gap-0.5 overflow-x-auto rounded-[9px] bg-muted p-[3px] max-sm:w-full"
          role="group"
          aria-label="Filter themes"
        >
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              type="button"
              onClick={() => setFilter(btn.value)}
              aria-pressed={filter === btn.value}
              className={cn(
                "flex h-[34px] flex-none items-center gap-1.5 rounded-[7px] px-3 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring max-sm:flex-1 max-sm:justify-center max-sm:px-2",
                filter === btn.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {/* Always mounted so screen readers announce the count when it appears. */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground",
          !loading && hasThemes && "mt-[18px]"
        )}
        aria-live="polite"
      >
        {!loading && hasThemes && (
          <>
            <span>
              {allLoaded
                ? themeList.length === 1
                  ? "1 theme loaded"
                  : `All ${themeList.length} themes loaded`
                : `${loadedThemes.size} of ${themeList.length} themes loaded`}
            </span>
            {canLoadMore && loadAllButton("link")}
          </>
        )}
      </div>

      {failedThemeNames.size > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="mt-2 flex flex-wrap items-center gap-x-3 text-[13px] text-destructive-foreground"
        >
          <span>
            {failedThemeNames.size} {failedThemeNames.size === 1 ? "theme" : "themes"} failed to
            load.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetryFailedThemes}
            className="h-7 px-2 text-destructive-foreground hover:bg-destructive-soft hover:text-destructive-foreground"
          >
            Retry failed {failedThemeNames.size === 1 ? "theme" : "themes"}
          </Button>
        </div>
      )}

      {/* Theme grid */}
      {loading ? (
        <div
          className={cn(GRID_CLASS, "mt-3.5 max-sm:[&>*:nth-child(n+5)]:hidden")}
          aria-busy="true"
          aria-label="Loading themes"
        >
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <ThemeCardSkeleton key={i} />
            ))}
        </div>
      ) : filteredThemes.length > 0 ? (
        <div id="theme-results" className={cn(GRID_CLASS, "mt-3.5")} aria-busy={loadingMore}>
          {filteredThemes.map((theme) => (
            <ThemeCard
              key={theme.name}
              theme={theme}
              isActive={appliedTheme === theme.name}
              onApply={handleApplyTheme}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-border-strong px-6 py-16 text-center">
          <SearchX className="size-[22px] text-subtle-foreground" aria-hidden="true" />
          <p className="text-[15px] font-medium">No themes found</p>
          <p className="max-w-[340px] text-[13px] leading-normal text-muted-foreground">
            {query
              ? `Nothing matches “${query}” in ${FILTER_LABELS[filter]}.`
              : `No ${FILTER_LABELS[filter]} are loaded.`}
            {canLoadMore &&
              ` Only ${loadedThemes.size} ${loadedThemes.size === 1 ? "theme is" : "themes are"} loaded. Loading all may find it.`}
          </p>
          {(canLoadMore || query) && (
            <div className="mt-1.5 flex gap-2">
              {canLoadMore && loadAllButton("primary")}
              {query && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Load more indicator */}
      {loadingMore && (
        <div
          className="flex justify-center py-4"
          role="status"
          aria-label="Loading more themes"
        >
          <Loader2
            aria-hidden="true"
            className="size-6 animate-spin text-muted-foreground motion-reduce:animate-none"
          />
        </div>
      )}
    </div>
  );
}
