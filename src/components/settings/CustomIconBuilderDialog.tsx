"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Palette, Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useConfigStore } from "@/lib/store/config-store";
import { cn } from "@/lib/utils";
import { CustomIconPreview } from "./CustomIconPreview";

// Frame definitions
const FRAMES = [
    { id: "aluminum", name: "Aluminum" },
    { id: "beige", name: "Beige" },
    { id: "plastic", name: "Plastic" },
    { id: "chrome", name: "Chrome" },
] as const;

// Preset colors for quick selection
const PRESET_COLORS = [
    "#ffffff", "#000000", "#1a1a2e", "#16213e",
    "#e94560", "#ff6b6b", "#feca57", "#48dbfb",
    "#1dd1a1", "#10ac84", "#5f27cd", "#341f97",
    "#ff9ff3", "#ffeaa7", "#dfe6e9", "#b2bec3",
];

interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (color: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
    const displayColor = value || "#000000";
    const isValidColor = /^#[0-9A-Fa-f]{6}$/.test(value);

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">{label}</Label>
            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-10 w-14 p-1"
                            style={{
                                backgroundColor: isValidColor ? displayColor : "transparent",
                            }}
                        >
                            {!isValidColor && (
                                <Paintbrush className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                        <div className="space-y-3">
                            <input
                                type="color"
                                value={isValidColor ? displayColor : "#ffffff"}
                                onChange={(e) => onChange(e.target.value)}
                                className="h-32 w-32 cursor-pointer rounded border-0"
                            />
                            <div className="grid grid-cols-8 gap-1">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color }}
                                        onClick={() => onChange(color)}
                                    />
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <Input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#ffffff"
                    className="max-w-28 font-mono text-sm"
                />

                {value && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange("")}
                        className="text-xs text-muted-foreground"
                    >
                        Clear
                    </Button>
                )}
            </div>
        </div>
    );
}

interface CustomIconBuilderDialogProps {
    trigger?: React.ReactNode;
}

export function CustomIconBuilderDialog({ trigger }: CustomIconBuilderDialogProps) {
    const [open, setOpen] = useState(false);
    const { getValue, setValue } = useConfigStore();

    const currentFrame = (getValue("macos-icon-frame") as string) || "aluminum";
    const ghostColor = (getValue("macos-icon-ghost-color") as string) || "";
    const screenColor = (getValue("macos-icon-screen-color") as string) || "";

    const handleFrameChange = (frameId: string) => {
        setValue("macos-icon-frame", frameId);
    };

    const handleGhostColorChange = (color: string) => {
        setValue("macos-icon-ghost-color", color);
    };

    const handleScreenColorChange = (color: string) => {
        setValue("macos-icon-screen-color", color);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Palette className="h-4 w-4" />
                        Customize Icon
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg p-6 overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Custom Icon Builder
                    </SheetTitle>
                    <SheetDescription>
                        Customize your Ghostty icon with your own colors. Changes preview in real-time.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6 pb-6">
                    {/* Live Preview */}
                    <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Live Preview</span>
                        <CustomIconPreview
                            frameId={currentFrame}
                            ghostColor={ghostColor}
                            screenColor={screenColor}
                            size={160}
                        />
                    </div>

                    {/* Frame Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Frame Style</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {FRAMES.map((frame) => {
                                const isSelected = currentFrame === frame.id;
                                return (
                                    <button
                                        key={frame.id}
                                        onClick={() => handleFrameChange(frame.id)}
                                        className={cn(
                                            "relative flex flex-col items-center p-2 rounded-lg border-2 transition-all",
                                            "hover:border-primary/50 hover:bg-primary/5",
                                            isSelected
                                                ? "border-primary bg-primary/10"
                                                : "border-border bg-card"
                                        )}
                                    >
                                        {isSelected && (
                                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                            </div>
                                        )}
                                        <div className="relative w-12 h-12">
                                            <Image
                                                src={`/icons/frames/${frame.id}.png`}
                                                alt={frame.name}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        <span className="text-xs mt-1">{frame.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Color Pickers */}
                    <div className="grid gap-4">
                        <ColorPicker
                            label="Ghost Color"
                            value={ghostColor}
                            onChange={handleGhostColorChange}
                        />
                        <ColorPicker
                            label="Screen Color"
                            value={screenColor}
                            onChange={handleScreenColorChange}
                        />
                    </div>

                    {/* Config Output */}
                    <div className="p-3 rounded-lg bg-muted/50 border text-xs font-mono space-y-1">
                        <div className="text-muted-foreground mb-2 text-xs uppercase tracking-wide">Config Output</div>
                        <div>macos-icon = custom-style</div>
                        <div>macos-icon-frame = {currentFrame}</div>
                        {ghostColor && <div>macos-icon-ghost-color = {ghostColor}</div>}
                        {screenColor && <div>macos-icon-screen-color = {screenColor}</div>}
                    </div>

                    {/* Note */}
                    <p className="text-xs text-muted-foreground">
                        Note: Set &quot;App Icon Style&quot; to &quot;Custom Style&quot; for these settings to take effect.
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}
