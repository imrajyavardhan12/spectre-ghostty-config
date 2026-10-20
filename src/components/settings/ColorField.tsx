"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ValidationMessages } from "./ValidationMessages";
import type { ColorOption } from "@/lib/schema/types";
import { hasValidationErrors, validateConfigValue } from "@/lib/utils/config-validation";

const PRESET_COLORS = [
  "#000000", "#1a1a2e", "#16213e", "#0f3460",
  "#e94560", "#ff6b6b", "#feca57", "#48dbfb",
  "#1dd1a1", "#10ac84", "#5f27cd", "#341f97",
  "#ffffff", "#f5f5f5", "#dfe6e9", "#b2bec3",
];

/** Ghostty accepts bare hex ("ffffff"); CSS and the canvas preview need the "#". */
export function toCssColor(color: string): string {
  return /^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(color) ? `#${color}` : color;
}

interface ColorFieldProps {
  option: ColorOption;
  /** The id of the text input, so the row's label can point at it. */
  id: string;
  /** Names the swatch button and the picker, for example "Background Color". */
  label: string;
  value: string;
  /** Called with a color Ghostty accepts, or "" to go back to the default. */
  onChange: (color: string) => void;
}

/** The color as CSS reads it: bare hex gets its "#", and X11 names lose their spaces. */
function swatchColor(color: string): string {
  const css = toCssColor(color.trim());
  return css.startsWith("#") ? css : css.replace(/\s+/g, "");
}

/** "#fff" and "fff" to "#ffffff", which is all a native color picker accepts. */
function pickerColor(color: string | null): string {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color ?? "")?.[1];
  if (!hex) return "#000000";
  return `#${hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex}`.toLowerCase();
}

/**
 * A swatch that opens a picker, beside a text field. Typing reaches the config only once the
 * text is a color Ghostty accepts. The typed text stays on screen while the field is being
 * edited, so "medium" doesn't swallow the space in "medium spring green". A change from
 * elsewhere, such as undo or reset, replaces it. The swatch paints what CSS understands, so
 * a few valid Ghostty names, like "cell-background", leave it blank.
 */
export function ColorField({ option, id, label, value, onChange }: ColorFieldProps) {
  const [open, setOpen] = useState(false);
  // `base` is the stored value the text was typed over; if it moves, the text is stale.
  const [draft, setDraft] = useState<{ text: string; base: string } | null>(null);

  const draftResult = draft === null ? null : validateConfigValue(option, draft.text);
  const draftIsCurrent =
    draft !== null &&
    draftResult !== null &&
    (hasValidationErrors(draftResult)
      ? draft.base === value
      : String(draftResult.normalizedValue ?? draft.text) === value);
  const shown = draftIsCurrent ? draft.text : value;

  const validation = draftIsCurrent && draftResult ? draftResult : validateConfigValue(option, shown);
  const hasErrors = hasValidationErrors(validation);
  const cssColor = hasErrors || shown === "" ? null : swatchColor(shown);

  function type(next: string) {
    const result = validateConfigValue(option, next);
    setDraft({ text: next, base: value });
    if (!hasValidationErrors(result)) {
      onChange(String(result.normalizedValue ?? next));
    }
  }

  function pick(color: string) {
    setDraft(null);
    onChange(color);
  }

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Choose ${label}`}
              className="size-[34px] shrink-0 rounded-md border border-input bg-field p-1 outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-accent"
            >
              <span
                className="block size-full rounded-sm bg-muted shadow-[inset_0_0_0_1px_rgba(127,127,127,.25)]"
                style={cssColor ? { backgroundColor: cssColor } : undefined}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[244px] space-y-3 p-3">
            <input
              type="color"
              aria-label={`${label} picker`}
              value={pickerColor(cssColor)}
              onChange={(e) => pick(e.target.value)}
              className="block h-24 w-full cursor-pointer rounded-md border-0 bg-transparent p-0"
            />
            <div>
              <p className="mb-1.5 text-[11px] text-subtle-foreground">Presets</p>
              <div className="grid grid-cols-8 gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    className="h-5 rounded-sm shadow-[inset_0_0_0_1px_rgba(127,127,127,.25)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{ backgroundColor: color }}
                    onClick={() => pick(color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  pick("");
                  setOpen(false);
                }}
              >
                Use default
              </Button>
              <Button size="sm" className="flex-1" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Input
          id={id}
          type="text"
          value={shown}
          onChange={(e) => type(e.target.value)}
          onBlur={() => setDraft(null)}
          placeholder="Default"
          aria-invalid={hasErrors}
          spellCheck={false}
          className="min-w-0 flex-1 font-mono"
        />
      </div>
      <ValidationMessages result={validation} />
    </div>
  );
}
