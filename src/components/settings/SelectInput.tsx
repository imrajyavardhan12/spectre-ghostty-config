"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingWrapper } from "./SettingWrapper";
import { useConfigStore } from "@/lib/store/config-store";
import { EnumOption } from "@/lib/schema/types";

interface SelectInputProps {
  option: EnumOption;
}

export function SelectInput({ option }: SelectInputProps) {
  const { getValue, setValue, resetValue, isModified } = useConfigStore();
  const value = getValue(option.id) as string;
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
      <Select
        value={value ?? option.default}
        onValueChange={(v) => setValue(option.id, v)}
      >
        <SelectTrigger className="max-w-xs">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {option.options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingWrapper>
  );
}
