"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    KEYBIND_ACTIONS,
    type KeybindAction,
    type ActionCategory
} from "@/lib/utils/keybind-validation";

interface ActionComboboxProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

// Category display names and order
const CATEGORY_INFO: Record<ActionCategory, { label: string; order: number }> = {
    clipboard: { label: "Clipboard", order: 1 },
    font: { label: "Font", order: 2 },
    scroll: { label: "Scroll", order: 3 },
    selection: { label: "Selection", order: 4 },
    tab: { label: "Tab", order: 5 },
    split: { label: "Split", order: 6 },
    window: { label: "Window", order: 7 },
    system: { label: "System", order: 8 },
    text: { label: "Text/Input", order: 9 },
    basic: { label: "Basic", order: 10 },
};

// Group actions by category
function groupActionsByCategory(actions: KeybindAction[]): Map<ActionCategory, KeybindAction[]> {
    const groups = new Map<ActionCategory, KeybindAction[]>();

    for (const action of actions) {
        const existing = groups.get(action.category) || [];
        existing.push(action);
        groups.set(action.category, existing);
    }

    return groups;
}

export function ActionCombobox({
    value,
    onChange,
    placeholder = "Select action...",
    className
}: ActionComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    // When an action with paramOptions is selected, show the param picker
    const [pendingAction, setPendingAction] = useState<KeybindAction | null>(null);
    // For free-form param input
    const [paramInput, setParamInput] = useState("");

    // Filter actions based on search
    const filteredActions = useMemo(() => {
        if (!search) return KEYBIND_ACTIONS;

        const lower = search.toLowerCase();
        return KEYBIND_ACTIONS.filter(
            a => a.action.includes(lower) || a.description.toLowerCase().includes(lower)
        );
    }, [search]);

    // Group filtered actions by category
    const groupedActions = useMemo(() => {
        const groups = groupActionsByCategory(filteredActions);

        // Sort groups by category order
        const sortedEntries = Array.from(groups.entries()).sort(
            (a, b) => CATEGORY_INFO[a[0]].order - CATEGORY_INFO[b[0]].order
        );

        return new Map(sortedEntries);
    }, [filteredActions]);

    // Get selected action info
    const selectedAction = useMemo(() => {
        const actionName = value.split(":")[0].toLowerCase();
        return KEYBIND_ACTIONS.find(a => a.action === actionName);
    }, [value]);

    const handleSelect = (action: KeybindAction) => {
        if (action.hasParam) {
            if (action.paramOptions && action.paramOptions.length > 0) {
                // Show param options picker
                setPendingAction(action);
                setSearch("");
            } else {
                // Free-form param input needed
                setPendingAction(action);
                setParamInput("");
                setSearch("");
            }
        } else {
            // No param needed, just set the action
            onChange(action.action);
            setOpen(false);
            setSearch("");
            setPendingAction(null);
        }
    };

    const handleParamSelect = (param: string) => {
        if (pendingAction) {
            onChange(`${pendingAction.action}:${param}`);
            setOpen(false);
            setPendingAction(null);
            setSearch("");
        }
    };

    const handleParamSubmit = () => {
        if (pendingAction && paramInput) {
            onChange(`${pendingAction.action}:${paramInput}`);
            setOpen(false);
            setPendingAction(null);
            setParamInput("");
        }
    };

    const handleBack = () => {
        setPendingAction(null);
        setParamInput("");
    };

    return (
        <Popover open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
                setPendingAction(null);
                setSearch("");
                setParamInput("");
            }
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "justify-between font-mono text-sm h-9",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">
                        {value || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    {/* Show param picker if pending action has options */}
                    {pendingAction ? (
                        <>
                            <div className="flex items-center border-b px-3 py-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 mr-2"
                                    onClick={handleBack}
                                >
                                    ← Back
                                </Button>
                                <span className="font-mono text-sm">{pendingAction.action}</span>
                                <span className="text-muted-foreground ml-1">:</span>
                            </div>

                            {pendingAction.paramOptions ? (
                                // Fixed options to choose from
                                <CommandList className="max-h-[250px]">
                                    <CommandGroup heading={pendingAction.paramDesc || "Select option"}>
                                        {pendingAction.paramOptions.map((option) => (
                                            <CommandItem
                                                key={option}
                                                value={option}
                                                onSelect={() => handleParamSelect(option)}
                                                className="font-mono"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        value === `${pendingAction.action}:${option}` ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {option}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            ) : (
                                // Free-form input
                                <div className="p-3 space-y-2">
                                    <p className="text-xs text-muted-foreground">{pendingAction.paramDesc}</p>
                                    <div className="flex gap-2">
                                        <Input
                                            value={paramInput}
                                            onChange={(e) => setParamInput(e.target.value)}
                                            placeholder="Enter value..."
                                            className="font-mono text-sm h-8"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleParamSubmit();
                                                }
                                            }}
                                        />
                                        <Button
                                            size="sm"
                                            className="h-8"
                                            onClick={handleParamSubmit}
                                            disabled={!paramInput}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // Normal action picker
                        <>
                            <CommandInput
                                placeholder="Search actions..."
                                value={search}
                                onValueChange={setSearch}
                            />
                            <CommandList className="max-h-[300px]">
                                <CommandEmpty>No action found.</CommandEmpty>

                                {Array.from(groupedActions.entries()).map(([category, actions]) => (
                                    <CommandGroup
                                        key={category}
                                        heading={CATEGORY_INFO[category].label}
                                    >
                                        {actions.map((action) => (
                                            <CommandItem
                                                key={action.action}
                                                value={action.action}
                                                onSelect={() => handleSelect(action)}
                                                className="flex flex-col items-start py-2"
                                            >
                                                <div className="flex items-center w-full gap-2">
                                                    <Check
                                                        className={cn(
                                                            "h-4 w-4 shrink-0",
                                                            selectedAction?.action === action.action
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    <span className="font-mono text-sm">{action.action}</span>

                                                    {/* Badges */}
                                                    <div className="flex items-center gap-1 ml-auto">
                                                        {action.hasParam && (
                                                            <Badge variant="secondary" className="text-[10px] px-1 py-0 flex items-center gap-0.5">
                                                                {action.paramOptions ? "options" : "param"}
                                                                <ChevronRight className="h-3 w-3" />
                                                            </Badge>
                                                        )}
                                                        {action.platform && (
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                                                                {action.platform}
                                                            </Badge>
                                                        )}
                                                        {action.deprecated && (
                                                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <p className="text-xs text-muted-foreground ml-6 mt-0.5 line-clamp-1">
                                                    {action.description}
                                                </p>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                ))}
                            </CommandList>
                        </>
                    )}
                </Command>
            </PopoverContent>
        </Popover>
    );
}
