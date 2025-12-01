"use client";

import { useState } from "react";
import { Plus, X, Keyboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SettingWrapper } from "./SettingWrapper";
import { useConfigStore } from "@/lib/store/config-store";
import { KeybindOption } from "@/lib/schema/types";

interface KeybindInputProps {
  option: KeybindOption;
}

export function KeybindInput({ option }: KeybindInputProps) {
  const { getValue, setValue, resetValue, isModified } = useConfigStore();
  const value = (getValue(option.id) as string[]) || [];
  const modified = isModified(option.id);

  const [newKey, setNewKey] = useState("");
  const [newAction, setNewAction] = useState("");

  const addKeybind = () => {
    if (newKey && newAction) {
      const keybind = `${newKey}=${newAction}`;
      setValue(option.id, [...value, keybind]);
      setNewKey("");
      setNewAction("");
    }
  };

  const removeKeybind = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    setValue(option.id, newValue);
  };

  const parseKeybind = (keybind: string): { key: string; action: string } => {
    const [key, ...actionParts] = keybind.split("=");
    return { key, action: actionParts.join("=") };
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
      <div className="space-y-4">
        {/* Existing keybinds */}
        {value.length > 0 && (
          <div className="space-y-2">
            {value.map((keybind, index) => {
              const { key, action } = parseKeybind(keybind);
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-md border bg-muted/50 p-2"
                >
                  <Keyboard className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary" className="font-mono">
                    {key}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <span className="flex-1 font-mono text-sm">{action}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeKeybind(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add new keybind */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="e.g., ctrl+shift+c"
            className="max-w-40 font-mono"
          />
          <span className="text-muted-foreground">=</span>
          <Input
            type="text"
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            placeholder="e.g., copy_to_clipboard"
            className="flex-1 max-w-xs font-mono"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={addKeybind}
            disabled={!newKey || !newAction}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Format: modifier+key=action (e.g., ctrl+shift+c=copy_to_clipboard)
        </p>
      </div>
    </SettingWrapper>
  );
}
