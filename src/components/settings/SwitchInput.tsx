"use client";

import { Switch } from "@/components/ui/switch";
import { SettingWrapper } from "./SettingWrapper";
import { useConfigStore } from "@/lib/store/config-store";
import { BooleanOption } from "@/lib/schema/types";

interface SwitchInputProps {
  option: BooleanOption;
}

export function SwitchInput({ option }: SwitchInputProps) {
  const { getValue, setValue, resetValue, isModified } = useConfigStore();
  const value = getValue(option.id) as boolean;
  const modified = isModified(option.id);

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
      <Switch
        id={option.id}
        checked={value ?? option.default}
        onCheckedChange={(checked) => setValue(option.id, checked)}
      />
    </SettingWrapper>
  );
}
