"use client";

import { Input } from "@/components/ui/input";
import { SettingWrapper } from "./SettingWrapper";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { DurationOption } from "@/lib/schema/types";

interface DurationInputProps {
  option: DurationOption;
}

export function DurationInput({ option }: DurationInputProps) {
  const { getValue, setValue, resetValue } = useConfigStore();
  const value = getValue(option.id) as string;
  const modified = useIsModified(option.id);

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
        value={value || ""}
        onChange={(e) => setValue(option.id, e.target.value)}
        placeholder={option.placeholder || option.default || "e.g., 750ms, 1s, 1h30m"}
        className="max-w-xs font-mono"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        Format: 1h, 30m, 45s, 750ms, 100us, 50ns
      </p>
    </SettingWrapper>
  );
}
