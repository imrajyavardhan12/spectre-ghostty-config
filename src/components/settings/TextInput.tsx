"use client";

import { Input } from "@/components/ui/input";
import { SettingWrapper } from "./SettingWrapper";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { StringOption } from "@/lib/schema/types";

interface TextInputProps {
  option: StringOption;
}

export function TextInput({ option }: TextInputProps) {
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
        placeholder={option.placeholder || `Default: ${option.default || "empty"}`}
        className="max-w-md"
      />
    </SettingWrapper>
  );
}
