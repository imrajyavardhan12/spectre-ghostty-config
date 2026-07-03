"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { SettingWrapper } from "./SettingWrapper";
import { ValidationMessages } from "./ValidationMessages";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { DurationOption } from "@/lib/schema/types";
import { hasValidationErrors, validateConfigValue } from "@/lib/utils/config-validation";
import { cn } from "@/lib/utils";

interface DurationInputProps {
  option: DurationOption;
}

export function DurationInput({ option }: DurationInputProps) {
  const { getValue, setValue, resetValue } = useConfigStore();
  const storeValue = getValue(option.id) as string;
  const modified = useIsModified(option.id);
  const [localValue, setLocalValue] = useState<string | null>(null);
  const displayValue = localValue ?? storeValue ?? "";
  const validation = validateConfigValue(option, displayValue);
  const hasErrors = hasValidationErrors(validation);

  const handleInputChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    const nextValidation = validateConfigValue(option, newValue);

    if (!hasValidationErrors(nextValidation)) {
      setValue(option.id, nextValidation.normalizedValue ?? newValue);
    }
  }, [option, setValue]);

  const handleInputBlur = useCallback(() => {
    setLocalValue(null);
  }, []);

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
      <Input
        id={option.id}
        type="text"
        value={displayValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={handleInputBlur}
        placeholder={option.placeholder || option.default || "e.g., 750ms, 1s, 1h30m"}
        aria-invalid={hasErrors}
        className={cn("max-w-xs font-mono", hasErrors && "border-destructive focus-visible:ring-destructive/40")}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        Format: 1h, 30m, 45s, 750ms, 100us, 50ns
      </p>
      <ValidationMessages result={validation} />
    </SettingWrapper>
  );
}
