"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Download, FileUp, Layers, Palette, Search, SearchX, X } from "lucide-react";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { allOptions } from "@/data/ghostty-options";
import { categories } from "@/data/categories";
import { ConfigOption, Platform } from "@/lib/schema/types";
import { useConfigStore } from "@/lib/store/config-store";
import { isOptionSupportedIn } from "@/lib/ghostty-versions";
import { searchOptions } from "@/lib/utils/option-search";
import { runEditorAction, type EditorAction } from "@/lib/editor-actions";

const PLATFORM_LABEL: Record<Platform, string> = {
  macos: "macOS",
  linux: "Linux",
  windows: "Windows",
};

const ACTIONS: Array<{ id: EditorAction; label: string; icon: typeof Download }> = [
  { id: "export", label: "Export config", icon: Download },
  { id: "import", label: "Import config…", icon: FileUp },
  { id: "presets", label: "Open presets", icon: Layers },
  { id: "themes", label: "Browse themes", icon: Palette },
];

const GROUP_CLASS =
  "p-0 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-[.06em] [&_[cmdk-group-heading]]:text-subtle-foreground [&_[cmdk-group-heading]]:uppercase";

interface CommandSearchProps {
  onSelectOption: (option: ConfigOption) => void;
}

export function CommandSearch({ onSelectOption }: CommandSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const ranActionRef = useRef(false);
  const targetVersion = useConfigStore((state) => state.targetVersion);
  const hideUnsupported = useConfigStore((state) => state.hideUnsupported);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Opening or closing, the next search starts empty.
        setQuery("");
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const changeOpen = useCallback((next: boolean) => {
    setOpen(next);
    // Each search starts empty, whichever way the last one ended.
    if (!next) setQuery("");
  }, []);

  const handleSelectAction = useCallback((action: EditorAction) => {
    // Presets opens a dialog and Themes leaves the page: focus belongs there, not back here.
    ranActionRef.current = action === "presets" || action === "themes";
    changeOpen(false);
    if (action === "presets") {
      // After the palette has closed, so the dialog doesn't fight it for focus.
      setTimeout(() => runEditorAction(action), 0);
    } else {
      // Import opens the file picker, which browsers allow only from inside the click.
      runEditorAction(action);
    }
  }, [changeOpen]);

  const handleSelectOption = useCallback((option: ConfigOption) => {
    changeOpen(false);
    onSelectOption(option);
  }, [changeOpen, onSelectOption]);

  // Options hidden from the editor, and newer-than-target ones when hiding, are not searchable.
  const visibleOptions = useMemo(
    () =>
      allOptions.filter(
        (opt) => !opt.hidden && (!hideUnsupported || isOptionSupportedIn(opt.id, targetVersion))
      ),
    [hideUnsupported, targetVersion]
  );
  const { results, total } = useMemo(() => searchOptions(visibleOptions, query), [visibleOptions, query]);
  const hasQuery = query.trim() !== "";
  const visibleActions = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return ACTIONS.filter(({ id, label }) =>
      words.every((word) => label.toLowerCase().includes(word) || id.includes(word))
    );
  }, [query]);
  const hasAnything = results.length > 0 || visibleActions.length > 0;
  const countLabel = total > results.length ? `${results.length} of ${total}` : `${total}`;
  // Spoken for screen readers; the list and the empty state are what sighted users see.
  const announcement = !hasQuery
    ? ""
    : results.length === 0
      ? "No matching options"
      : `${countLabel} ${total === 1 ? "option" : "options"}`;

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={() => {
          ranActionRef.current = false;
        }}
        onCloseAutoFocus={(event) => {
          // The action took focus elsewhere (a dialog, the file picker, another page).
          if (ranActionRef.current) event.preventDefault();
        }}
        className="gap-0 overflow-hidden bg-popover p-0 sm:max-w-[620px] md:top-[88px] md:translate-y-0 max-md:top-0 max-md:left-0 max-md:h-dvh max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none"
      >
        <DialogTitle className="sr-only">Search Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Search for Ghostty configuration options by name, key or description
        </DialogDescription>

        <Command
          label="Search"
          shouldFilter={false}
          className="rounded-none max-md:h-full md:max-h-[min(520px,calc(100dvh-120px))]"
        >
          <div
            data-slot="command-input-wrapper"
            className="flex h-[54px] shrink-0 items-center gap-2.5 border-b border-border px-3.5"
          >
            <Search className="size-[17px] shrink-0 text-subtle-foreground" aria-hidden="true" />
            <CommandPrimitive.Input
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Search options, keys, or actions"
              autoFocus
              spellCheck={false}
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-hidden placeholder:text-subtle-foreground"
            />
            <Kbd variant="hint" className="max-md:hidden">esc</Kbd>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 size-11 md:hidden"
              aria-label="Close"
              onClick={() => changeOpen(false)}
            >
              <X className="size-5" />
            </Button>
          </div>

          <div role="status" className="sr-only">
            {announcement}
          </div>

          {/* Always present, so the input's aria-controls has a target; hidden when empty. */}
          <CommandList hidden={!hasAnything} className="max-h-none min-h-0 flex-1 p-1.5">
            {results.length > 0 && (
              <CommandGroup
                heading={hasQuery ? `Options · ${countLabel}` : "Suggested"}
                className={GROUP_CLASS}
              >
                {results.map((option) => (
                  <ResultRow
                    key={option.id}
                    option={option}
                    needsNewer={!isOptionSupportedIn(option.id, targetVersion)}
                    onSelect={handleSelectOption}
                  />
                ))}
              </CommandGroup>
            )}
            {visibleActions.length > 0 && (
              <CommandGroup heading="Actions" className={cn(GROUP_CLASS, "mt-1.5")}>
                {visibleActions.map(({ id, label, icon: Icon }) => (
                  <CommandItem
                    key={id}
                    value={`action-${id}`}
                    onSelect={() => handleSelectAction(id)}
                    className="h-10 gap-3 rounded-[7px] px-2.5 data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
                  >
                    <Icon className="size-[15px] text-muted-foreground" aria-hidden="true" />
                    {label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          {!hasAnything && (
            // Outside the list: this is a message, not a result.
            <div className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto px-6 py-12 text-center">
              <SearchX className="size-[22px] text-subtle-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">No options match “{query.trim()}”</p>
              <p className="max-w-80 text-[13px] leading-normal text-muted-foreground">
                Try a name, a key like <code className="font-mono">cursor-style</code>, or words from a
                description.
              </p>
              <Button variant="outline" size="sm" className="mt-1.5" onClick={() => {
                  setQuery("");
                  // The button goes away with the message; keep focus in the dialog.
                  inputRef.current?.focus();
                }}
              >
                Clear search
              </Button>
            </div>
          )}

          <div className="flex h-[38px] shrink-0 items-center gap-4 border-t border-border px-3.5 text-xs text-subtle-foreground max-md:hidden">
            <span className="flex items-center gap-1.5">
              <span className="font-mono">↑↓</span>Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-mono">↵</span>Go to option
            </span>
            <span className="flex-1" />
            <span>
              {visibleOptions.length} options · {categories.length} categories
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function ResultRow({
  option,
  needsNewer,
  onSelect,
}: {
  option: ConfigOption;
  needsNewer: boolean;
  onSelect: (option: ConfigOption) => void;
}) {
  const category = categories.find((c) => c.id === option.category);
  // The macOS and Linux categories already say it.
  const platform = option.platform?.map((p) => PLATFORM_LABEL[p]).join(", ");
  const showPlatform = platform && platform !== category?.name;

  return (
    <CommandItem
      value={option.id}
      onSelect={() => onSelect(option)}
      className="min-h-11 gap-3 rounded-[7px] px-2.5 py-1.5 data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm">{option.name}</span>
        <span className="truncate font-mono text-xs text-subtle-foreground">{option.id}</span>
      </span>
      {needsNewer && option.sinceVersion && (
        <Badge variant="warning" className="h-4 px-1.5 py-0 text-[10px]">
          Needs {option.sinceVersion}
        </Badge>
      )}
      <span className="shrink-0 text-xs text-muted-foreground">
        {category?.name}
        {showPlatform && ` · ${platform} only`}
      </span>
    </CommandItem>
  );
}
