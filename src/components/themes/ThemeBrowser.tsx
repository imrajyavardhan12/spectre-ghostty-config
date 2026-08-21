"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search, Palette, Moon, Sun, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeCard, ThemeCardSkeleton } from "./ThemeCard";
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
  status: ThemeLoadStatus;
  priorities: Map<ThemeLoadSource, number>;
  controller: AbortController;
  promise: Promise<void>;
  resolve: () => void;
}

export function ThemeBrowser() {
  const [themeList, setThemeList] = useState<ThemeListItem[]>([]);
  const [loadedThemes, setLoadedThemes] = useState<Map<string, Theme>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("featured");
  const [appliedTheme, setAppliedTheme] = useState<string | null>(null);
  const loadedThemesRef = useRef(loadedThemes);
  const pendingThemeLoadsRef = useRef(new Map<string, ThemeLoadTask>());
  const queuedThemeLoadsRef = useRef<ThemeLoadTask[]>([]);
  const activeThemeLoadsRef = useRef(0);
  const themeLoadOrderRef = useRef(0);
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

  const detachThemeLoad = useCallback(
    (task: ThemeLoadTask) => {
      if (pendingThemeLoadsRef.current.get(task.name) !== task) return;

      pendingThemeLoadsRef.current.delete(task.name);
      if (task.status === "active") {
        activeThemeLoadsRef.current = Math.max(0, activeThemeLoadsRef.current - 1);
      } else {
        queuedThemeLoadsRef.current = queuedThemeLoadsRef.current.filter(
          (queuedTask) => queuedTask !== task
        );
      }

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
        })
        .catch(() => undefined)
        .finally(() => {
          if (pendingThemeLoadsRef.current.get(task.name) !== task) return;

          pendingThemeLoadsRef.current.delete(task.name);
          activeThemeLoadsRef.current = Math.max(
            0,
            activeThemeLoadsRef.current - 1
          );
          task.resolve();
          updateLoadingMore();
          drainThemeQueueRef.current();
        });
    }
  }, [updateLoadingMore]);
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
          status: "queued",
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
  }, [loadThemeBatch]);

  // Filter and search themes
  const filteredThemes = useMemo(() => {
    let themes = Array.from(loadedThemes.values());

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      themes = themes.filter((t) =>
        t.name.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filter === "dark") {
      themes = themes.filter((t) => categorizeTheme(t) === "dark");
    } else if (filter === "light") {
      themes = themes.filter((t) => categorizeTheme(t) === "light");
    } else if (filter === "featured" && !searchQuery) {
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
  }, [loadedThemes, searchQuery, filter]);

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
    if (!searchQuery) return;

    const priority = ++searchPriorityRef.current;
    const timeoutId = window.setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const matchingNames = themeList
        .filter((theme) => theme.name.toLowerCase().includes(query))
        .map((theme) => theme.name)
        .slice(0, 20);

      void loadThemeBatch(matchingNames, "search", priority);
    }, SEARCH_LOAD_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, themeList, loadThemeBatch, releaseThemeLoadSource]);

  // Load all themes button
  const handleLoadAll = async () => {
    const allNames = themeList.map((t) => t.name);
    await loadThemeBatch(allNames, "manual");
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
  };

  const filterButtons: { value: FilterType; label: string; icon?: React.ReactNode }[] = [
    { value: "all", label: "All" },
    { value: "featured", label: "Featured", icon: <Palette className="h-3.5 w-3.5" /> },
    { value: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
    { value: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
  ];

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Palette className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-lg font-medium mb-2">Failed to load themes</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <label htmlFor="theme-search" className="sr-only">
            Search themes
          </label>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            id="theme-search"
            type="search"
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div
          className="grid grid-cols-2 gap-2 sm:flex"
          role="group"
          aria-label="Filter themes"
        >
          {filterButtons.map((btn) => (
            <Button
              key={btn.value}
              variant={filter === btn.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(btn.value)}
              aria-pressed={filter === btn.value}
              className="gap-1.5"
            >
              {btn.icon}
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div
        className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground"
        aria-live="polite"
      >
        <span>
          {loadedThemes.size} of {themeList.length} themes loaded
        </span>
        {loadedThemes.size < themeList.length && (
          <Button
            variant="link"
            size="sm"
            onClick={handleLoadAll}
            disabled={loadingMore}
            className="h-auto p-0"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Loading...
              </>
            ) : (
              "Load all themes"
            )}
          </Button>
        )}
        {appliedTheme && (
          <Badge variant="secondary" className="gap-1">
            <Palette className="h-3 w-3" />
            {appliedTheme}
          </Badge>
        )}
      </div>

      {/* Theme grid */}
      {loading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
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
        <div
          id="theme-results"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          aria-busy={loadingMore}
        >
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-2">No themes found</p>
          <p className="text-sm text-muted-foreground">
            Try a different search term or filter
          </p>
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
            className="h-6 w-6 animate-spin text-muted-foreground"
          />
        </div>
      )}
    </div>
  );
}
