"use client";

import { Switch } from "@/components/ui/switch";
import { SettingWrapper } from "./SettingWrapper";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { BooleanOption } from "@/lib/schema/types";

interface SwitchInputProps {
  option: BooleanOption;
}

export function SwitchInput({ option }: SwitchInputProps) {
  const { getValue, setValue, resetValue } = useConfigStore();
  const value = getValue(option.id) as boolean;
  const modified = useIsModified(option.id);
  const checked = value ?? option.default;

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
      <div className="flex items-center justify-end gap-2.5 text-[13px] text-muted-foreground">
        <span aria-hidden="true">{checked ? "On" : "Off"}</span>
        <Switch
          id={option.id}
          checked={checked}
          onCheckedChange={(next) => setValue(option.id, next)}
        />
      </div>
    </SettingWrapper>
  );
}
