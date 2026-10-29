"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SettingWrapper } from "./SettingWrapper";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { StringOption } from "@/lib/schema/types";
import { hasValidationErrors, validateConfigValue } from "@/lib/utils/config-validation";
import { cn } from "@/lib/utils";
import { ValidationMessages } from "./ValidationMessages";

interface TextInputProps {
  option: StringOption;
}

export function TextInput({ option }: TextInputProps) {
  const { getValue, setValue, resetValue } = useConfigStore();
  const value = getValue(option.id) as string;
  const modified = useIsModified(option.id);
  // Text that fails the option's own grammar stays here and out of the config, so it is never exported.
  // It belongs to the config it was typed over: any other change to the config (reset, undo, a preset,
  // an import) replaces the config object and makes it stale, even when this option's value didn't change.
  const config = useConfigStore((state) => state.config);
  const [draft, setDraft] = useState<{ text: string; over: typeof config } | null>(null);

  const shown = draft && draft.over === config ? draft.text : value ?? "";
  const validation = validateConfigValue(option, shown);
  const hasErrors = hasValidationErrors(validation);

  function change(next: string) {
    if (hasValidationErrors(validateConfigValue(option, next))) {
      setDraft({ text: next, over: config });
      return;
    }
    setDraft(null);
    setValue(option.id, next);
  }

  return (
    <SettingWrapper
      id={option.id}
      name={option.name}
      description={option.description}
      isModified={modified}
      onReset={() => {
        setDraft(null);
        resetValue(option.id);
      }}
      note={option.note}
      deprecated={option.deprecated}
      sinceVersion={option.sinceVersion}
      platform={option.platform}
    >
      <Input
        id={option.id}
        type="text"
        value={shown}
        onChange={(e) => change(e.target.value)}
        placeholder={option.placeholder || option.default || "Not set"}
        aria-invalid={hasErrors}
        className={cn("w-full font-mono", hasErrors && "border-destructive focus-visible:ring-destructive/40")}
      />
      <ValidationMessages result={validation} />
    </SettingWrapper>
  );
}
