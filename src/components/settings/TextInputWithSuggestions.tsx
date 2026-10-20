"use client";

import { Fragment } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SettingWrapper } from "./SettingWrapper";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { StringOption } from "@/lib/schema/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TextInputWithSuggestionsProps {
  option: StringOption;
}

/**
 * A text field with its known values as chips. Options that take a list of flags toggle each
 * chip in and out of the comma-separated value; the rest take one value, which a second click
 * on the chosen chip puts back to the default.
 */
export function TextInputWithSuggestions({ option }: TextInputWithSuggestionsProps) {
  const { getValue, setValue, resetValue } = useConfigStore();
  const value = (getValue(option.id) as string) || "";
  const modified = useIsModified(option.id);
  const multiple = option.multiValue === true;

  const currentValues = value.split(",").map((v) => v.trim()).filter(Boolean);

  function isOn(chip: string) {
    return multiple ? currentValues.includes(chip) : value === chip;
  }

  function toggle(chip: string) {
    if (!multiple) {
      if (isOn(chip)) resetValue(option.id);
      else setValue(option.id, chip);
      return;
    }
    const next = isOn(chip) ? currentValues.filter((v) => v !== chip) : [...currentValues, chip];
    if (next.length === 0) resetValue(option.id);
    else setValue(option.id, next.join(","));
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
      <div className="space-y-2">
        <Input
          id={option.id}
          type="text"
          value={value}
          onChange={(e) => setValue(option.id, e.target.value)}
          placeholder={option.placeholder || option.default || "Not set"}
          spellCheck={false}
          className="font-mono"
        />

        {option.validValues && option.validValues.length > 0 && (
          <div
            role="group"
            aria-label={`${option.name} suggestions`}
            className="flex flex-wrap items-center gap-1.5"
          >
            <span className="mr-0.5 text-[11px] text-subtle-foreground" aria-hidden="true">
              {multiple ? "Add" : "Use"}
            </span>
            <TooltipProvider>
              {option.validValues.map((validValue) => {
                const on = isOn(validValue.value);
                const chip = (
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(validValue.value)}
                    className={cn(
                      "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 font-mono text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                      on
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border-strong text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {on && <Check className="size-3" aria-hidden="true" />}
                    {validValue.label}
                  </button>
                );

                if (!validValue.description) return <Fragment key={validValue.value}>{chip}</Fragment>;

                return (
                  <Tooltip key={validValue.value}>
                    <TooltipTrigger asChild>{chip}</TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">{validValue.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        )}
      </div>
    </SettingWrapper>
  );
}
