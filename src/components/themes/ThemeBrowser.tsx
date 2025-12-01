"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, Palette, Moon, Sun, Loader2 } from "lucide-react";
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
import { useConfigStore } from "@/lib/store/config-store";
import { cn } from "@/lib/utils";

type FilterType = "all" | "dark" | "light" | "featured";

export function ThemeBrowser() {
  const [themeList, setThemeList] = useState<ThemeListItem[]>([]);
  const [loadedThemes, setLoadedThemes] = useState<Map<string, Theme>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [appliedTheme, setAppliedTheme] = useState<string | null>(null);
  
  const { loadConfig, config } = useConfigStore();

  // Fetch theme list on mount
  useEffect(() => {
    async function loadThemeList() {
      try {
        setLoading(true);
        const list = await fetchThemeList();
        setThemeList(list);
        
        // Load featured themes first
        const featuredNames = list
          .filter((t) => FEATURED_THEMES.includes(t.name))
          .map((t) => t.name)
          .slice(0, 12);
        
        await loadThemeBatch(featuredNames);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load themes");
      } finally {
        setLoading(false);
      }
    }
    
    loadThemeList();
  }, []);

  // Load a batch of themes
  async function loadThemeBatch(names: string[]) {
    const unloaded = names.filter((name) => !loadedThemes.has(name));
    if (unloaded.length === 0) return;

    setLoadingMore(true);
    
    const results = await Promise.allSettled(unloaded.map(fetchTheme));
    
    setLoadedThemes((prev) => {
      const next = new Map(prev);
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          next.set(unloaded[index], result.value);
        }
      });
      return next;
    });
    
    setLoadingMore(false);
  }

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
    } else if (filter === "featured") {
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

  // Load more themes when searching
  useEffect(() => {
    if (!searchQuery) return;
    
    const matchingNames = themeList
      .filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((t) => t.name)
      .slice(0, 20);
    
    loadThemeBatch(matchingNames);
  }, [searchQuery, themeList]);

  // Load all themes button
  const handleLoadAll = async () => {
    const allNames = themeList.map((t) => t.name);
    await loadThemeBatch(allNames);
  };

  // Apply theme
  const handleApplyTheme = (theme: Theme) => {
    const themeConfig = themeToConfig(theme);
    
    // Merge with existing config (keep non-color settings)
    const colorKeys = [
      "background",
      "foreground",
      "cursor-color",
      "cursor-text",
      "selection-background",
      "selection-foreground",
      "palette",
    ];
    
    const newConfig = { ...config };
    
    // Remove old color settings
    colorKeys.forEach((key) => {
      delete newConfig[key];
    });
    
    // Add new theme colors
    Object.assign(newConfig, themeConfig);
    
    loadConfig(newConfig);
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          {filterButtons.map((btn) => (
            <Button
              key={btn.value}
              variant={filter === btn.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(btn.value)}
              className="gap-1.5"
            >
              {btn.icon}
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <ThemeCardSkeleton key={i} />
            ))}
        </div>
      ) : filteredThemes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
