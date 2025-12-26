"use client";

import { Input } from "@/components/ui/input";
import { SettingWrapper } from "./SettingWrapper";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { StringOption } from "@/lib/schema/types";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface TextInputWithSuggestionsProps {
    option: StringOption;
}

export function TextInputWithSuggestions({ option }: TextInputWithSuggestionsProps) {
    const { getValue, setValue, resetValue } = useConfigStore();
    const value = getValue(option.id) as string;
    const modified = useIsModified(option.id);

    // Parse current values into an array
    const currentValues = value
        ? value.split(",").map((v) => v.trim()).filter(Boolean)
        : [];

    // Check if a value is already in the input
    const isValueSelected = (val: string) => currentValues.includes(val);

    // Add a value to the input
    const addValue = (val: string) => {
        if (isValueSelected(val)) return;
        const newValues = [...currentValues, val];
        setValue(option.id, newValues.join(","));
    };

    // Remove a value from the input
    const removeValue = (val: string) => {
        const newValues = currentValues.filter((v) => v !== val);
        setValue(option.id, newValues.join(","));
    };

    // Toggle a value
    const toggleValue = (val: string) => {
        if (isValueSelected(val)) {
            removeValue(val);
        } else {
            addValue(val);
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
                <Input
                    id={option.id}
                    type="text"
                    value={value || ""}
                    onChange={(e) => setValue(option.id, e.target.value)}
                    placeholder={option.placeholder || `Default: ${option.default || "empty"}`}
                    className="max-w-md"
                />

                {/* Valid values chips */}
                {option.validValues && option.validValues.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Click to add/remove:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {option.validValues.map((validValue) => {
                                const isSelected = isValueSelected(validValue.value);

                                const chip = (
                                    <button
                                        key={validValue.value}
                                        type="button"
                                        onClick={() => toggleValue(validValue.value)}
                                        className={cn(
                                            "inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200",
                                            "border focus:outline-none focus:ring-2 focus:ring-primary/20",
                                            isSelected
                                                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground hover:border-primary/30"
                                        )}
                                    >
                                        {!isSelected && <span className="mr-1 opacity-60">+</span>}
                                        {validValue.label}
                                        {isSelected && <span className="ml-1.5 opacity-80">✓</span>}
                                    </button>
                                );

                                // Wrap with tooltip if description exists
                                if (validValue.description) {
                                    return (
                                        <TooltipProvider key={validValue.value}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>{chip}</TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs">
                                                    <p className="text-xs">{validValue.description}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    );
                                }

                                return chip;
                            })}
                        </div>
                    </div>
                )}
            </div>
        </SettingWrapper>
    );
}
