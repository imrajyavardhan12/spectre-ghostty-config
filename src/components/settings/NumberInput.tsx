"use client";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { SettingWrapper } from "./SettingWrapper";
import { ValidationMessages } from "./ValidationMessages";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { NumberOption } from "@/lib/schema/types";
import { hasValidationErrors, hasValidationWarnings, validateConfigValue } from "@/lib/utils/config-validation";
import { cn } from "@/lib/utils";

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
  const inputClassName = cn(
    hasErrors && "border-destructive focus-visible:ring-destructive/40",
    !hasErrors && hasWarnings && "border-amber-500 focus-visible:ring-amber-500/40"
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
      <div className="flex items-center gap-4">
        {useSlider ? (
          <>
            <Slider
              id={option.id}
              value={[sliderValue]}
              onValueChange={([v]) => setValue(option.id, v)}
              min={option.min}
              max={option.max}
              step={option.step || 1}
              className="flex-1 max-w-xs"
            />
            <Input
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
          <Input
            id={option.id}
            type="number"
            value={value ?? option.default}
            onChange={(e) => setValue(option.id, parseFloat(e.target.value) || 0)}
            min={option.min}
            max={option.max}
            step={option.step || 1}
            aria-invalid={hasErrors}
            className={cn("max-w-32", inputClassName)}
          />
        )}
      </div>
      <ValidationMessages result={validation} />
    </SettingWrapper>
  );
}
