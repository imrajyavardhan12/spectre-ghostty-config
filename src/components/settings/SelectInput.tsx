"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingWrapper } from "./SettingWrapper";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { EnumOption } from "@/lib/schema/types";

interface SelectInputProps {
  option: EnumOption;
}

// Radix UI Select.Item forbids empty string values (reserved for "clear selection").
// Use this sentinel to represent an empty-string config value in the UI.
const EMPTY_SENTINEL = "__empty__";

function toUiValue(v: string) {
  return v === "" ? EMPTY_SENTINEL : v;
}

function fromUiValue(v: string) {
  return v === EMPTY_SENTINEL ? "" : v;
}

export function SelectInput({ option }: SelectInputProps) {
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
      <Select
        value={toUiValue(value ?? option.default)}
        onValueChange={(v) => setValue(option.id, fromUiValue(v))}
      >
        <SelectTrigger className="max-w-xs">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {option.options.map((opt) => (
            <SelectItem key={opt.value} value={toUiValue(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingWrapper>
  );
}
