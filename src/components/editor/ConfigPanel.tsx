"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingRenderer } from "@/components/settings";
import { getOptionsByCategory } from "@/data/ghostty-options";
import { splitOptionsBySupport } from "@/lib/ghostty-versions";
import { useConfigStore } from "@/lib/store/config-store";
import { categories } from "@/data/categories";
import { Category } from "@/lib/schema/types";
import { cn } from "@/lib/utils";
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
  Info,
} from "lucide-react";

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

interface ConfigPanelProps {
  category: Category;
  highlightedOption?: string | null;
}

export function ConfigPanel({ category, highlightedOption }: ConfigPanelProps) {
  const targetVersion = useConfigStore((state) => state.targetVersion);
  const hideUnsupported = useConfigStore((state) => state.hideUnsupported);
  const allCategoryOptions = getOptionsByCategory(category);
  const { supported, unsupported } = splitOptionsBySupport(allCategoryOptions, targetVersion);
  const options = hideUnsupported ? supported : allCategoryOptions;
  const hiddenCount = hideUnsupported ? unsupported.length : 0;
  const categoryInfo = categories.find((c) => c.id === category);
  const Icon = iconMap[categoryInfo?.icon || "Settings"] || Settings;

  return (
    <ScrollArea className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)]">
      <div className="p-6 max-w-3xl mx-auto" key={category}>
        {/* Category header */}
        <div className="mb-8 animate-fade-down">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {categoryInfo?.name}
              </h1>
              {categoryInfo?.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {categoryInfo.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Font preview info note - only shown for fonts category */}
        {category === "fonts" && (
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 animate-fade-up">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-200 font-medium mb-1">Preview Font Limitation</p>
                <p className="text-muted-foreground">
                  The terminal preview can only display fonts available in your browser.
                  For custom fonts, they must be installed on your system.
                  Ghostty&apos;s built-in default is <span className="text-foreground font-medium">JetBrains Mono</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {hiddenCount > 0 && (
          <p role="status" className="mb-4 text-xs text-muted-foreground">
            {hiddenCount} {hiddenCount === 1 ? "option needs" : "options need"} a newer Ghostty than {targetVersion} and {hiddenCount === 1 ? "is" : "are"} hidden.
          </p>
        )}

        {/* Options list */}
        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              id={`option-${option.id}`}
              key={option.id}
              className={cn(
                "animate-fade-up [animation-fill-mode:backwards] rounded-lg transition-all duration-500",
                highlightedOption === option.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
              style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
            >
              <SettingRenderer option={option} />
            </div>
          ))}
        </div>

        {/* Empty state */}
        {options.length === 0 && (
          <div className="text-center py-16 animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {hiddenCount > 0
                ? `Every option here needs a newer Ghostty than ${targetVersion}.`
                : "No options available for this category."}
            </p>
          </div>
        )}

        {/* Bottom padding for floating button */}
        <div className="h-24" />
      </div>
    </ScrollArea>
  );
}
