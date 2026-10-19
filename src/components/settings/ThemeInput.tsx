"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GHOSTTY_BUILTIN_THEMES } from "@/data/ghostty-builtin-themes";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { StringOption } from "@/lib/schema/types";
import { cn } from "@/lib/utils";
import { SettingWrapper } from "./SettingWrapper";

const NONE_LABEL = "None (Ghostty default)";

interface ThemeInputProps {
  option: StringOption;
}

/**
 * The `theme` option as a searchable list of Ghostty's built-in themes. Ghostty also accepts a
 * theme file path or a `light:X,dark:Y` pair, so any search text can be used as-is.
 */
export function ThemeInput({ option }: ThemeInputProps) {
  const { getValue, setValue, resetValue } = useConfigStore();
  const value = (getValue(option.id) as string) ?? "";
  const modified = useIsModified(option.id);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const typed = search.trim();
  // A name that differs only by case still points at a built-in theme: don't offer it as custom.
  const offerTyped =
    typed !== "" && !GHOSTTY_BUILTIN_THEMES.some((name) => name.toLowerCase() === typed.toLowerCase());

  function choose(next: string) {
    if (next === "") resetValue(option.id);
    else setValue(option.id, next);
    setOpen(false);
    setSearch("");
  }

  return (
    <SettingWrapper
      id={option.id}
      name={option.name}
      description={option.description}
      isModified={modified}
      onReset={() => resetValue(option.id)}
      note={option.note}
      deprecated={option.deprecated}
      sinceVersion={option.sinceVersion}
      platform={option.platform}
    >
      <div className="flex flex-col gap-2">
        <Popover
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setSearch("");
          }}
        >
          <PopoverTrigger asChild>
            <Button
              id={option.id}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-labelledby={`${option.id}-label ${option.id}`}
              className="h-[34px] w-full justify-between px-2.5 text-[13px] font-normal"
            >
              <span className={cn("truncate", !value && "text-muted-foreground")}>
                {value || NONE_LABEL}
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search themes..." value={search} onValueChange={setSearch} />
              <CommandList className="max-h-[300px]">
                <CommandGroup>
                  <CommandItem value={NONE_LABEL} onSelect={() => choose("")}>
                    <Check className={cn("size-4", value === "" ? "opacity-100" : "opacity-0")} />
                    {NONE_LABEL}
                  </CommandItem>
                  {GHOSTTY_BUILTIN_THEMES.map((name) => (
                    <CommandItem key={name} value={name} onSelect={() => choose(name)}>
                      <Check className={cn("size-4", value === name ? "opacity-100" : "opacity-0")} />
                      {name}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {/* Outside the group: cmdk hides a group whose items were all filtered out,
                    and the typed value must stay reachable whatever the search matches. */}
                {offerTyped && (
                  <CommandItem forceMount value={`use ${typed}`} onSelect={() => choose(typed)}>
                    <Check className="size-4 opacity-0" />
                    <span className="truncate">
                      Use <span className="font-mono">{typed}</span>
                    </span>
                  </CommandItem>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Link
          href="/themes"
          className="inline-flex items-center gap-1.5 self-start rounded-xs text-[13px] text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Browse all themes
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </SettingWrapper>
  );
}
