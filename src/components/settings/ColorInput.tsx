"use client";

import { SettingWrapper } from "./SettingWrapper";
import { ColorField } from "./ColorField";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { ColorOption } from "@/lib/schema/types";

interface ColorInputProps {
  option: ColorOption;
}

export function ColorInput({ option }: ColorInputProps) {
  const { getValue, setValue, resetValue } = useConfigStore();
  const value = (getValue(option.id) as string) || "";
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
      <ColorField
        option={option}
        id={option.id}
        label={option.name}
        value={value}
        onChange={(color) => setValue(option.id, color)}
      />
    </SettingWrapper>
  );
}
