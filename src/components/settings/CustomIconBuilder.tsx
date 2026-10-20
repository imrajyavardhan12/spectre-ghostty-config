"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getOptionById } from "@/data/ghostty-options";
import { useConfigStore } from "@/lib/store/config-store";
import { hasValidationErrors, validateConfigValue } from "@/lib/utils/config-validation";
import { cn } from "@/lib/utils";
import { CustomIconPreview } from "./CustomIconPreview";

const FRAMES = [
  { id: "aluminum", name: "Aluminum" },
  { id: "beige", name: "Beige" },
  { id: "plastic", name: "Plastic" },
  { id: "chrome", name: "Chrome" },
] as const;

const PRESET_COLORS = [
  "#ffffff", "#000000", "#1a1a2e", "#16213e",
  "#e94560", "#ff6b6b", "#feca57", "#48dbfb",
  "#1dd1a1", "#10ac84", "#5f27cd", "#341f97",
  "#ff9ff3", "#ffeaa7", "#dfe6e9", "#b2bec3",
];

/** Ghostty accepts bare hex ("ffffff"); CSS and the canvas preview need the "#". */
function toCssColor(color: string): string {
  return /^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(color) ? `#${color}` : color;
}

interface IconColorFieldProps {
  label: string;
  optionId: string;
  value: string;
  onChange: (color: string) => void;
}

/**
 * A color field for one of the icon's color options. Typing reaches the config only once the
 * text is a color Ghostty accepts; until then it stays a local draft, so undo and the
 * pickers always show the stored value.
 */
function IconColorField({ label, optionId, value, onChange }: IconColorFieldProps) {
  const inputId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value;
  const invalid = draft !== null && draft !== "";
  const cssColor = toCssColor(value);

  function type(next: string) {
    const option = getOptionById(optionId);
    const result = option ? validateConfigValue(option, next) : undefined;
    if (result && !hasValidationErrors(result)) {
      setDraft(null);
      onChange(String(result.normalizedValue ?? next));
    } else {
      setDraft(next);
    }
  }

  function pick(color: string) {
    setDraft(null);
    onChange(color);
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-[13px] font-medium text-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-[34px] w-12 p-1"
              aria-label={`Choose ${label.toLowerCase()}`}
              style={{ backgroundColor: value ? cssColor : "transparent" }}
            >
              {!value && <Paintbrush className="size-4 text-muted-foreground" aria-hidden="true" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-3">
              <input
                type="color"
                aria-label={`${label} picker`}
                value={/^#[0-9a-f]{6}$/i.test(cssColor) ? cssColor : "#ffffff"}
                onChange={(e) => pick(e.target.value)}
                className="h-32 w-32 cursor-pointer rounded border-0"
              />
              <div className="grid grid-cols-8 gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    className="size-6 rounded border border-border transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    style={{ backgroundColor: color }}
                    onClick={() => pick(color)}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Input
          id={inputId}
          type="text"
          value={shown}
          onChange={(e) => type(e.target.value)}
          onBlur={() => setDraft(null)}
          placeholder="#ffffff"
          aria-invalid={invalid}
          spellCheck={false}
          className="w-28 font-mono"
        />

        {value && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => pick("")}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

/** The custom-style icon editor, shown inside the App Icon row while "Custom" is selected. */
export function CustomIconBuilder() {
  const { getValue, setValue } = useConfigStore();
  const frame = (getValue("macos-icon-frame") as string) || "aluminum";
  const ghostColor = (getValue("macos-icon-ghost-color") as string) || "";
  const screenColor = (getValue("macos-icon-screen-color") as string) || "";

  return (
    <div
      data-testid="custom-icon-builder"
      className="mt-4 flex flex-wrap items-start gap-x-6 gap-y-4 rounded-lg border border-border bg-muted/30 p-4"
    >
      <div className="mx-auto shrink-0 sm:mx-0">
        <CustomIconPreview
          frameId={frame}
          ghostColor={toCssColor(ghostColor)}
          screenColor={toCssColor(screenColor)}
          size={104}
        />
      </div>

      <div className="min-w-0 flex-[1_1_240px] space-y-4">
        <div className="space-y-1.5">
          <span id="custom-icon-frame-label" className="text-[13px] font-medium text-foreground">
            Frame
          </span>
          <div role="group" aria-labelledby="custom-icon-frame-label" className="grid grid-cols-4 gap-2">
            {FRAMES.map((option) => {
              const selected = frame === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setValue("macos-icon-frame", option.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-1.5 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-primary bg-accent text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="relative size-9">
                    <Image
                      src={`/icons/frames/${option.id}.png`}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-contain"
                    />
                  </span>
                  {option.name}
                </button>
              );
            })}
          </div>
        </div>

        <IconColorField
          label="Ghost color"
          optionId="macos-icon-ghost-color"
          value={ghostColor}
          onChange={(color) => setValue("macos-icon-ghost-color", color)}
        />
        <IconColorField
          label="Screen color"
          optionId="macos-icon-screen-color"
          value={screenColor}
          onChange={(color) => setValue("macos-icon-screen-color", color)}
        />
      </div>
    </div>
  );
}
