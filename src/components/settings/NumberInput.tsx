"use client";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { SettingWrapper } from "./SettingWrapper";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { NumberOption } from "@/lib/schema/types";

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
              value={[value ?? option.default]}
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
              className="w-24"
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
            className="max-w-32"
          />
        )}
      </div>
    </SettingWrapper>
  );
}
