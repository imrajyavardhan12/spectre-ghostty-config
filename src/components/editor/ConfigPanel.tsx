"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingRenderer } from "@/components/settings";
import { getOptionsByCategory } from "@/data/ghostty-options";
import { categories } from "@/data/categories";
import { Category } from "@/lib/schema/types";
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
}

export function ConfigPanel({ category }: ConfigPanelProps) {
  const options = getOptionsByCategory(category);
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

        {/* Options list */}
        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={option.id}
              className="animate-fade-up [animation-fill-mode:backwards]"
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
              No options available for this category.
            </p>
          </div>
        )}

        {/* Bottom padding for floating button */}
        <div className="h-24" />
      </div>
    </ScrollArea>
  );
}
