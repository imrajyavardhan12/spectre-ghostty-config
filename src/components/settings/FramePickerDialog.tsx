"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Frame } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useConfigStore } from "@/lib/store/config-store";
import { cn } from "@/lib/utils";

// Frame definitions with metadata
const GHOSTTY_FRAMES = [
    {
        id: "aluminum",
        name: "Aluminum",
        description: "Brushed aluminum frame (default)",
        image: "/icons/frames/aluminum.png",
    },
    {
        id: "beige",
        name: "Beige",
        description: "Classic 90's computer beige",
        image: "/icons/frames/beige.png",
    },
    {
        id: "plastic",
        name: "Plastic",
        description: "Glossy dark plastic",
        image: "/icons/frames/plastic.png",
    },
    {
        id: "chrome",
        name: "Chrome",
        description: "Shiny chrome finish",
        image: "/icons/frames/chrome.png",
    },
] as const;

interface FramePickerDialogProps {
    trigger?: React.ReactNode;
}

export function FramePickerDialog({ trigger }: FramePickerDialogProps) {
    const [open, setOpen] = useState(false);
    const { getValue, setValue } = useConfigStore();

    const currentFrame = (getValue("macos-icon-frame") as string) || "aluminum";

    const handleSelectFrame = (frameId: string) => {
        setValue("macos-icon-frame", frameId);
        setTimeout(() => setOpen(false), 300);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Frame className="h-4 w-4" />
                        Choose Frame
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl p-6">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Frame className="h-5 w-5 text-primary" />
                        App Icon Frame
                    </SheetTitle>
                    <SheetDescription>
                        Choose a frame style for the Ghostty icon. This changes the
                        &quot;computer monitor&quot; material surrounding the ghost.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                    {/* Frame Grid - 2x2 layout */}
                    <div className="grid grid-cols-2 gap-4">
                        {GHOSTTY_FRAMES.map((frame) => {
                            const isSelected = currentFrame === frame.id;

                            return (
                                <button
                                    key={frame.id}
                                    onClick={() => handleSelectFrame(frame.id)}
                                    className={cn(
                                        "relative group flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200",
                                        "hover:border-primary/50 hover:bg-primary/5 hover:shadow-md",
                                        isSelected
                                            ? "border-primary bg-primary/10 shadow-md"
                                            : "border-border bg-card"
                                    )}
                                >
                                    {/* Selection indicator */}
                                    {isSelected && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                        </div>
                                    )}

                                    {/* Frame Image */}
                                    <div className="relative w-24 h-24 mb-2">
                                        <Image
                                            src={frame.image}
                                            alt={frame.name}
                                            fill
                                            sizes="96px"
                                            className="object-contain rounded-lg transition-transform duration-200 group-hover:scale-105"
                                        />
                                    </div>

                                    {/* Label */}
                                    <span className={cn(
                                        "text-sm font-medium transition-colors",
                                        isSelected ? "text-primary" : "text-foreground"
                                    )}>
                                        {frame.name}
                                    </span>

                                    {/* Description */}
                                    <span className="text-xs text-muted-foreground text-center mt-0.5">
                                        {frame.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Current Selection Info */}
                    <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 shrink-0">
                                <Image
                                    src={GHOSTTY_FRAMES.find(f => f.id === currentFrame)?.image || "/icons/frames/aluminum.png"}
                                    alt="Selected frame"
                                    fill
                                    sizes="64px"
                                    className="object-contain rounded-lg"
                                />
                            </div>
                            <div>
                                <h4 className="font-medium">
                                    {GHOSTTY_FRAMES.find(f => f.id === currentFrame)?.name || "Aluminum"}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    {GHOSTTY_FRAMES.find(f => f.id === currentFrame)?.description || "Brushed aluminum frame (default)"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Config: <code className="px-1 py-0.5 bg-muted rounded">macos-icon-frame = {currentFrame}</code>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <p className="mt-4 text-xs text-muted-foreground">
                        Note: Frame changes require restarting Ghostty or reloading the config to take effect.
                        Frames are used with the custom-style icon.
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}
