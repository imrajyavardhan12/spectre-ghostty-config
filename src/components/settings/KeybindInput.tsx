"use client";

import { useState, useMemo } from "react";
import { Plus, X, Keyboard, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SettingWrapper } from "./SettingWrapper";
import { ActionCombobox } from "./ActionCombobox";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { KeybindOption } from "@/lib/schema/types";
import {
  validateTriggerSequence,
  validateAction,
  validateKeybind,
  KEYBIND_ACTIONS,
  KEYBIND_EXAMPLES,
} from "@/lib/utils/keybind-validation";
import { cn } from "@/lib/utils";

interface KeybindInputProps {
  option: KeybindOption;
}

export function KeybindInput({ option }: KeybindInputProps) {
  const { getValue, setValue, resetValue } = useConfigStore();
  const value = (getValue(option.id) as string[]) || [];
  const modified = useIsModified(option.id);

  const [newKey, setNewKey] = useState("");
  const [newAction, setNewAction] = useState("");
  const [showExamples, setShowExamples] = useState(false);

  // Validate trigger input (handles sequences like ctrl+x>2)
  const triggerValidation = useMemo(() => {
    if (!newKey) return null;
    return validateTriggerSequence(newKey);
  }, [newKey]);

  // Validate action input
  const actionValidation = useMemo(() => {
    if (!newAction) return null;
    return validateAction(newAction);
  }, [newAction]);

  // Check if current inputs form a valid keybind
  const canAdd = useMemo(() => {
    if (!newKey || !newAction) return false;
    const validation = validateKeybind(`${newKey}=${newAction}`);
    return validation.valid;
  }, [newKey, newAction]);

  // Validate existing keybinds
  const validateExistingKeybind = (keybind: string) => {
    return validateKeybind(keybind);
  };

  const addKeybind = () => {
    if (newKey && newAction && canAdd) {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canAdd) {
      e.preventDefault();
      addKeybind();
    }
  };

  // Get param description for the current action
  const actionParamHint = useMemo(() => {
    if (!newAction) return null;
    const actionName = newAction.split(":")[0].toLowerCase();
    const actionDef = KEYBIND_ACTIONS.find(a => a.action === actionName);
    if (actionDef?.hasParam && newAction.includes(":")) {
      return actionDef.paramDesc;
    }
    return null;
  }, [newAction]);

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
              const validation = validateExistingKeybind(keybind);
              const hasErrors = !validation.valid;
              const hasWarnings = validation.warnings.length > 0;

              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 rounded-md border p-2",
                    hasErrors
                      ? "border-destructive/50 bg-destructive/5"
                      : hasWarnings
                        ? "border-amber-500/50 bg-amber-500/5"
                        : "border-border bg-muted/50"
                  )}
                >
                  <Keyboard className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Badge variant="secondary" className="font-mono">
                    {key}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <span className="flex-1 font-mono text-sm truncate">{action}</span>

                  {/* Validation indicator */}
                  {(hasErrors || hasWarnings) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertCircle
                            className={cn(
                              "h-4 w-4 shrink-0",
                              hasErrors ? "text-destructive" : "text-amber-500"
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <div className="space-y-1">
                            {validation.errors.map((err, i) => (
                              <p key={i} className="text-xs text-destructive">{err}</p>
                            ))}
                            {validation.warnings.map((warn, i) => (
                              <p key={i} className="text-xs text-amber-500">{warn}</p>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
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
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ctrl+shift+c"
                className={cn(
                  "max-w-40 font-mono pr-7",
                  newKey && triggerValidation && !triggerValidation.valid && "border-destructive"
                )}
              />
              {newKey && triggerValidation && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {triggerValidation.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">{triggerValidation.error}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
            </div>

            <span className="text-muted-foreground">=</span>

            {/* Action Combobox with searchable dropdown */}
            <div className="flex-1 max-w-xs flex items-center gap-2">
              <ActionCombobox
                value={newAction}
                onChange={setNewAction}
                placeholder="Select action..."
                className="flex-1"
              />

              {/* Validation indicator */}
              {newAction && actionValidation && (
                actionValidation.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">{actionValidation.error}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={addKeybind}
              disabled={!canAdd}
            >
              <Plus className="h-4 w-4" />
            </Button>

            {/* Help / Examples button */}
            <Popover open={showExamples} onOpenChange={setShowExamples}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Keybind Examples</h4>
                  <div className="space-y-2">
                    {KEYBIND_EXAMPLES.map((example) => (
                      <button
                        key={example.trigger}
                        type="button"
                        className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors"
                        onClick={() => {
                          setNewKey(example.trigger);
                          setNewAction(example.action);
                          setShowExamples(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {example.trigger}
                          </Badge>
                          <span className="text-muted-foreground text-xs">→</span>
                          <span className="font-mono text-xs">{example.action}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{example.description}</p>
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    <p><strong>Modifiers:</strong> ctrl, shift, alt, super (cmd on macOS)</p>
                    <p className="mt-1"><strong>Format:</strong> modifier+key=action</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Validation feedback */}
          {(newKey || newAction) && (
            <div className="text-xs text-muted-foreground">
              {triggerValidation?.valid && triggerValidation.sequences.length > 0 && (
                <span className="mr-3">
                  Sequence: {triggerValidation.sequences.map((seq, i) => {
                    const parts = [...seq.modifiers];
                    if (seq.key) parts.push(seq.key);
                    return parts.join("+");
                  }).join(" → ")}
                </span>
              )}
              {actionValidation?.valid && actionValidation.param && (
                <span>
                  Action: {actionValidation.action} (param: {actionValidation.param})
                </span>
              )}
              {actionParamHint && (
                <span className="block mt-1 text-muted-foreground/70">
                  Parameter: {actionParamHint}
                </span>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Format: modifier+key=action (e.g., ctrl+shift+c=copy_to_clipboard)
        </p>
      </div>
    </SettingWrapper>
  );
}
