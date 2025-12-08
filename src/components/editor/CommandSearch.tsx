"use client";

import { useEffect, useState, useCallback } from "react";
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
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { allOptions } from "@/data/ghostty-options";
import { categories } from "@/data/categories";
import { Category, ConfigOption } from "@/lib/schema/types";
import { Badge } from "@/components/ui/badge";

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

interface CommandSearchProps {
  onSelectOption: (option: ConfigOption) => void;
  onSelectCategory: (category: Category) => void;
}

export function CommandSearch({ onSelectOption, onSelectCategory }: CommandSearchProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelectOption = useCallback((option: ConfigOption) => {
    setOpen(false);
    onSelectOption(option);
  }, [onSelectOption]);

  const handleSelectCategory = useCallback((category: Category) => {
    setOpen(false);
    onSelectCategory(category);
  }, [onSelectCategory]);

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return iconMap[category?.icon || "Settings"] || Settings;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "boolean":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "number":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "color":
        return "bg-pink-500/10 text-pink-500 border-pink-500/20";
      case "enum":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "keybind":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Filter out hidden options
  const visibleOptions = allOptions.filter((opt) => !opt.hidden);

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={setOpen}
      title="Search Settings"
      description="Search for Ghostty configuration options"
    >
      <CommandInput placeholder="Search settings..." />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>No settings found.</CommandEmpty>
        
        {/* Categories */}
        <CommandGroup heading="Categories">
          {categories.map((category) => {
            const Icon = iconMap[category.icon || "Settings"] || Settings;
            const optionCount = visibleOptions.filter(
              (opt) => opt.category === category.id
            ).length;
            
            return (
              <CommandItem
                key={category.id}
                value={`category-${category.id} ${category.name}`}
                onSelect={() => handleSelectCategory(category.id)}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{category.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {optionCount} options
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {/* Options grouped by category */}
        {categories.map((category) => {
          const categoryOptions = visibleOptions.filter(
            (opt) => opt.category === category.id
          );
          
          if (categoryOptions.length === 0) return null;

          return (
            <CommandGroup key={category.id} heading={category.name}>
              {categoryOptions.map((option) => {
                const Icon = getCategoryIcon(option.category);
                
                return (
                  <CommandItem
                    key={option.id}
                    value={`${option.id} ${option.name} ${option.description} ${option.category}`}
                    onSelect={() => handleSelectOption(option)}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.name}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0 h-4 ${getTypeColor(option.type)}`}
                        >
                          {option.type}
                        </Badge>
                        {option.platform && (
                          <Badge 
                            variant="outline" 
                            className="text-[10px] px-1.5 py-0 h-4"
                          >
                            {option.platform.join(", ")}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {option.description}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}

// Button to trigger search (for header)
export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 border border-border rounded-md hover:bg-muted transition-colors"
    >
      <span>Search settings...</span>
      <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}
