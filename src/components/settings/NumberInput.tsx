"use client";

import { Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { SettingWrapper } from "./SettingWrapper";
import { ValidationMessages } from "./ValidationMessages";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { NumberOption } from "@/lib/schema/types";
import { hasValidationErrors, hasValidationWarnings, validateConfigValue } from "@/lib/utils/config-validation";
import { cn } from "@/lib/utils";

/** Digits after the decimal point, including numbers JavaScript prints as 1e-7. */
function decimalPlaces(n: number): number {
  const [mantissa, exponent = "0"] = String(n).split("e");
  const fraction = (mantissa.split(".")[1] ?? "").length;
  return Math.min(20, Math.max(0, fraction - Number(exponent)));
}

interface NumberInputProps {
  option: NumberOption;
  showSlider?: boolean;
}

export function NumberInput({ option, showSlider = true }: NumberInputProps) {
  const { getValue, setValue, resetValue } = useConfigStore();
  const value = getValue(option.id) as number;
  const modified = useIsModified(option.id);

  const hasRange = option.min !== undefined && option.max !== undefined;
  const useSlider = showSlider && hasRange;
  const validation = validateConfigValue(option, value ?? option.default);
  const hasErrors = hasValidationErrors(validation);
  const hasWarnings = hasValidationWarnings(validation);
  const sliderValue = hasRange
    ? Math.min(option.max!, Math.max(option.min!, value ?? option.default))
    : value ?? option.default;
  const current = value ?? option.default;
  const step = option.step || 1;

  function stepBy(direction: 1 | -1) {
    // Round to the finer of the step's and the current value's precision so 0.1 + 0.2 style
    // drift never reaches the config and a typed 1.234 isn't truncated by the first click.
    const decimals = Math.max(decimalPlaces(step), decimalPlaces(current));
    const next = Number((current + direction * step).toFixed(decimals));
    setValue(option.id, Math.min(option.max ?? Infinity, Math.max(option.min ?? -Infinity, next)));
  }

  const inputClassName = cn(
    hasErrors && "border-destructive focus-visible:ring-destructive/40",
    !hasErrors && hasWarnings && "border-warning focus-visible:ring-warning/40"
  );

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
      <div className={cn("flex items-center gap-3", !useSlider && "justify-end")}>
        {useSlider ? (
          <>
            <Slider
              aria-label={`${option.name} slider`}
              value={[sliderValue]}
              onValueChange={([v]) => setValue(option.id, v)}
              min={option.min}
              max={option.max}
              step={option.step || 1}
              className="min-w-0 flex-1"
            />
            <Input
              id={option.id}
              type="number"
              value={value ?? option.default}
              onChange={(e) => setValue(option.id, parseFloat(e.target.value) || 0)}
              min={option.min}
              max={option.max}
              step={option.step || 1}
              aria-invalid={hasErrors}
              className={cn("w-24", inputClassName)}
            />
          </>
        ) : (
          <div
            className={cn(
              "flex h-[34px] items-center rounded-md border border-input bg-field transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-accent",
              inputClassName
            )}
          >
            <button
              type="button"
              aria-label={`Decrease ${option.name}`}
              onClick={() => stepBy(-1)}
              className="grid h-full w-8 place-items-center rounded-l-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Minus className="size-3.5" aria-hidden="true" />
            </button>
            <input
              id={option.id}
              type="number"
              value={current}
              onChange={(e) => setValue(option.id, parseFloat(e.target.value) || 0)}
              min={option.min}
              max={option.max}
              step={step}
              aria-invalid={hasErrors}
              className="h-full w-24 [appearance:textfield] bg-transparent px-0 text-center font-mono text-[13px] font-medium outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              aria-label={`Increase ${option.name}`}
              onClick={() => stepBy(1)}
              className="grid h-full w-8 place-items-center rounded-r-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <ValidationMessages result={validation} />
    </SettingWrapper>
  );
}
