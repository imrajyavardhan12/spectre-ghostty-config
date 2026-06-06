"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SettingWrapper } from "./SettingWrapper";
import { ValidationMessages } from "./ValidationMessages";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { ColorOption } from "@/lib/schema/types";
import { hasValidationErrors, validateConfigValue } from "@/lib/utils/config-validation";
import { cn } from "@/lib/utils";

interface ColorInputProps {
  option: ColorOption;
}

export function ColorInput({ option }: ColorInputProps) {
  const { getValue, setValue, resetValue } = useConfigStore();
  const storeValue = getValue(option.id) as string;
  const modified = useIsModified(option.id);
  
  const [localValue, setLocalValue] = useState<string | null>(null);
  
  // Use local value if user is typing, otherwise use store value
  const displayValue = localValue ?? storeValue ?? "";

  const handleInputChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    const validation = validateConfigValue(option, newValue);

    if (!hasValidationErrors(validation)) {
      setValue(option.id, validation.normalizedValue ?? newValue);
    }
  }, [option, setValue]);

  const handleInputBlur = useCallback(() => {
    // Reset local value on blur to sync with store
    setLocalValue(null);
  }, []);

  const handleColorPickerChange = useCallback((newValue: string) => {
    setLocalValue(null);
    setValue(option.id, newValue);
  }, [option.id, setValue]);

  const validation = validateConfigValue(option, displayValue);
  const hasErrors = hasValidationErrors(validation);
  const hexColor = /^#?(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(displayValue)
    ? displayValue.startsWith("#") ? displayValue : `#${displayValue}`
    : null;
  const isDisplayableColor = Boolean(hexColor);

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
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-10 w-14 p-1"
              style={{
                backgroundColor: isDisplayableColor ? hexColor! : "transparent",
              }}
            >
              {!isDisplayableColor && (
                <span className="text-xs text-muted-foreground">Pick</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-3">
              <input
                type="color"
                value={isDisplayableColor ? hexColor! : "#000000"}
                onChange={(e) => handleColorPickerChange(e.target.value)}
                className="h-32 w-32 cursor-pointer rounded border-0"
              />
              <div className="grid grid-cols-8 gap-1">
                {[
                  "#000000", "#1a1a2e", "#16213e", "#0f3460",
                  "#e94560", "#ff6b6b", "#feca57", "#48dbfb",
                  "#1dd1a1", "#10ac84", "#5f27cd", "#341f97",
                  "#ffffff", "#f5f5f5", "#dfe6e9", "#b2bec3",
                ].map((color) => (
                  <button
                    key={color}
                    className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorPickerChange(color)}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Input
          id={option.id}
          type="text"
          value={displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleInputBlur}
          placeholder="#000000"
          aria-invalid={hasErrors}
          className={cn("max-w-32 font-mono", hasErrors && "border-destructive focus-visible:ring-destructive/40")}
        />
      </div>
      <ValidationMessages result={validation} />
    </SettingWrapper>
  );
}
