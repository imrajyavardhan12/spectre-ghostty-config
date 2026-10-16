"use client";

import { cn } from "@/lib/utils";
import { categories } from "@/data/categories";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Type,
  Palette,
  AppWindow,
  MousePointer2,
  Mouse,
  Clipboard,
  Keyboard,
  Terminal,
  Settings,
  TerminalSquare,
  Apple,
  Monitor,
  Wrench,
  ArrowUpRight,
  BookOpen,
  Layers,
} from "lucide-react";
import { Category } from "@/lib/schema/types";
import { useConfigStore } from "@/lib/store/config-store";
import { getOptionsByCategory } from "@/data/ghostty-options";
import { splitOptionsBySupport } from "@/lib/ghostty-versions";
import { VersionFilterControls } from "@/components/editor/VersionFilterControls";
import { PresetsDialog } from "@/components/editor/PresetsDialog";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  Palette,
  AppWindow,
  MousePointer2,
  Mouse,
  Clipboard,
  Keyboard,
  Terminal,
  Settings,
  TerminalSquare,
  Apple,
  Monitor,
  Wrench,
};

interface SidebarProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

export function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  const config = useConfigStore((state) => state.config);
  const targetVersion = useConfigStore((state) => state.targetVersion);
  const hideUnsupported = useConfigStore((state) => state.hideUnsupported);

  const hasSupportedOptions = (categoryId: Category): boolean =>
    splitOptionsBySupport(getOptionsByCategory(categoryId), targetVersion).supported.length > 0;

  const getModifiedCount = (categoryId: Category): number => {
    const options = getOptionsByCategory(categoryId);
    return options.filter((opt) => opt.id in config).length;
  };

  return (
    <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 flex-col border-r border-border bg-background md:flex">
      <ScrollArea className="min-h-0 flex-1">
        <nav aria-labelledby="sidebar-categories" className="p-3">
          <p
            id="sidebar-categories"
            className="px-2.5 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wider text-subtle-foreground"
          >
            Categories
          </p>
          <ul className="space-y-0.5">
            {categories.map((category) => {
              const Icon = iconMap[category.icon || "Settings"] || Settings;
              const isActive = activeCategory === category.id;
              const modifiedCount = getModifiedCount(category.id);
              if (hideUnsupported && !hasSupportedOptions(category.id)) return null;

              return (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => onCategoryChange(category.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors",
                      isActive
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", isActive ? "text-foreground" : "text-subtle-foreground")} />
                    <span className="flex-1 truncate text-left">{category.name}</span>
                    {modifiedCount > 0 && (
                      <span className="font-mono text-[11px] tabular-nums text-accent-foreground">
                        {modifiedCount}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>

      <div className="space-y-3 p-3 pt-0">
        <div className="rounded-lg border border-border bg-card p-3">
          <VersionFilterControls />
        </div>
        <a
          href="https://ghostty.org/docs/config"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <BookOpen className="size-3.5" aria-hidden="true" />
          <span>Ghostty docs</span>
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}

interface MobileSidebarProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

export function MobileCategoryBar({
  activeCategory,
  onCategoryChange,
}: MobileSidebarProps) {
  const config = useConfigStore((state) => state.config);
  const targetVersion = useConfigStore((state) => state.targetVersion);
  const hideUnsupported = useConfigStore((state) => state.hideUnsupported);

  const hasSupportedOptions = (categoryId: Category): boolean =>
    splitOptionsBySupport(getOptionsByCategory(categoryId), targetVersion).supported.length > 0;

  const getModifiedCount = (categoryId: Category): number => {
    const options = getOptionsByCategory(categoryId);
    return options.filter((opt) => opt.id in config).length;
  };

  return (
    <div className="shrink-0 border-b border-border bg-background md:hidden">
      <div className="px-3 pt-2">
        <VersionFilterControls compact />
      </div>
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 p-2">
          {/* The header's presets button is hidden below xl; offer it here too. */}
          <span className="flex shrink-0 items-center border-r border-border pr-1.5">
            <PresetsDialog
              trigger={
                <button
                  type="button"
                  className="flex h-9 items-center gap-1.5 rounded-full border border-border-strong px-3.5 text-[13px] font-medium whitespace-nowrap text-foreground transition-colors hover:bg-muted"
                >
                  <Layers className="size-3.5" aria-hidden="true" />
                  <span>Presets</span>
                </button>
              }
            />
          </span>
          {categories.map((category) => {
            const Icon = iconMap[category.icon || "Settings"] || Settings;
            const isActive = activeCategory === category.id;
            const modifiedCount = getModifiedCount(category.id);
            if (hideUnsupported && !hasSupportedOptions(category.id)) return null;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                <span>{category.name}</span>
                {modifiedCount > 0 && (
                  <span className="font-mono text-[11px] tabular-nums">{modifiedCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
