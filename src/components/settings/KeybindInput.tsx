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
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { KeybindOption } from "@/lib/schema/types";
import { 
  validateTrigger, 
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

  // Validate trigger input
  const triggerValidation = useMemo(() => {
    if (!newKey) return null;
    return validateTrigger(newKey);
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

  // Filter action suggestions based on input
  const actionSuggestions = useMemo(() => {
    if (!newAction || newAction.length < 2) return [];
    const search = newAction.toLowerCase().split(":")[0];
    return KEYBIND_ACTIONS
      .filter(a => a.action.includes(search))
      .slice(0, 8);
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
            
            <div className="relative flex-1 max-w-xs">
              <Input
                type="text"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="copy_to_clipboard"
                className={cn(
                  "font-mono pr-7",
                  newAction && actionValidation && !actionValidation.valid && "border-destructive"
                )}
              />
              {newAction && actionValidation && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {actionValidation.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">{actionValidation.error}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
              
              {/* Action suggestions dropdown */}
              {actionSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                  {actionSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.action}
                      type="button"
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted flex items-center justify-between"
                      onClick={() => {
                        setNewAction(suggestion.hasParam ? `${suggestion.action}:` : suggestion.action);
                      }}
                    >
                      <span className="font-mono">{suggestion.action}</span>
                      {suggestion.hasParam && (
                        <span className="text-xs text-muted-foreground">+ param</span>
                      )}
                    </button>
                  ))}
                </div>
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
              {triggerValidation?.valid && triggerValidation.modifiers.length > 0 && (
                <span className="mr-3">
                  Modifiers: {triggerValidation.modifiers.join(" + ")}
                  {triggerValidation.key && ` + ${triggerValidation.key}`}
                </span>
              )}
              {actionValidation?.valid && actionValidation.param && (
                <span>
                  Action: {actionValidation.action} (param: {actionValidation.param})
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
