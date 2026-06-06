"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingWrapper } from "./SettingWrapper";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { StringOption } from "@/lib/schema/types";
import { cn } from "@/lib/utils";

interface RepeatableTextInputProps {
  option: StringOption;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  return [];
}

function toStoreValue(values: string[]): string | string[] {
  return values.length === 1 ? values[0] : values;
}

export function RepeatableTextInput({ option }: RepeatableTextInputProps) {
  const { getValue, setValue, resetValue } = useConfigStore();
  const values = toStringArray(getValue(option.id));
  const modified = useIsModified(option.id);
  const [draftValue, setDraftValue] = useState("");

  const commitValues = (nextValues: string[]) => {
    const cleanedValues = nextValues.map((value) => value.trim()).filter(Boolean);

    if (cleanedValues.length === 0) {
      resetValue(option.id);
      return;
    }

    setValue(option.id, toStoreValue(cleanedValues));
  };

  const addValue = () => {
    const nextValue = draftValue.trim();
    if (!nextValue) return;

    commitValues([...values, nextValue]);
    setDraftValue("");
  };

  const removeValue = (index: number) => {
    commitValues(values.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addValue();
    }
  };

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
      <div className="space-y-3">
        {values.length > 0 ? (
          <div className="space-y-2">
            {values.map((value, index) => (
              <div
                key={`${value}-${index}`}
                className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-2"
              >
                <code className="flex-1 truncate text-sm text-foreground">
                  {value}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeValue(index)}
                  aria-label={`Remove ${option.name} value ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
            No values configured. Ghostty will use its default behavior.
          </div>
        )}

        <div className="flex max-w-lg items-center gap-2">
          <Input
            id={option.id}
            type="text"
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={option.placeholder || `Add ${option.name.toLowerCase()}`}
            className="font-mono"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addValue}
            disabled={!draftValue.trim()}
            aria-label={`Add ${option.name} value`}
            className={cn(draftValue.trim() && "border-primary/40 text-primary")}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Repeatable option: Spectre exports one <code>{option.id}</code> line per value.
        </p>
      </div>
    </SettingWrapper>
  );
}
