"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Monitor } from "lucide-react";
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

// Icon definitions with metadata
const GHOSTTY_ICONS = [
  {
    id: "official",
    name: "Official",
    description: "The default Ghostty icon",
    image: "/icons/official.png",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description: "Technical blueprint style",
    image: "/icons/blueprint.png",
  },
  {
    id: "chalkboard",
    name: "Chalkboard",
    description: "Chalk drawing aesthetic",
    image: "/icons/chalkboard.png",
  },
  {
    id: "glass",
    name: "Glass",
    description: "Transparent glass effect",
    image: "/icons/glass.png",
  },
  {
    id: "holographic",
    name: "Holographic",
    description: "Iridescent holographic style",
    image: "/icons/holographic.png",
  },
  {
    id: "microchip",
    name: "Microchip",
    description: "Circuit board inspired",
    image: "/icons/microchip.png",
  },
  {
    id: "paper",
    name: "Paper",
    description: "Paper craft style",
    image: "/icons/paper.png",
  },
  {
    id: "retro",
    name: "Retro",
    description: "Vintage computing aesthetic",
    image: "/icons/retro.png",
  },
  {
    id: "xray",
    name: "X-Ray",
    description: "X-ray transparent view",
    image: "/icons/xray.png",
  },
] as const;

interface IconPickerDialogProps {
  trigger?: React.ReactNode;
}

export function IconPickerDialog({ trigger }: IconPickerDialogProps) {
  const [open, setOpen] = useState(false);
  const { getValue, setValue } = useConfigStore();
  
  const currentIcon = (getValue("macos-icon") as string) || "official";

  const handleSelectIcon = (iconId: string) => {
    setValue("macos-icon", iconId);
    setTimeout(() => setOpen(false), 300);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Monitor className="h-4 w-4" />
            Choose Icon
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            App Icon
          </SheetTitle>
          <SheetDescription>
            Choose an icon style for Ghostty on macOS. The icon appears in the Dock, 
            Application Switcher, and Finder.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {/* Icon Grid */}
          <div className="grid grid-cols-3 gap-4">
            {GHOSTTY_ICONS.map((icon) => {
              const isSelected = currentIcon === icon.id;
              
              return (
                <button
                  key={icon.id}
                  onClick={() => handleSelectIcon(icon.id)}
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
                  
                  {/* Icon Image */}
                  <div className="relative w-20 h-20 mb-2">
                    <Image
                      src={icon.image}
                      alt={icon.name}
                      fill
                      className="object-contain rounded-lg transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {icon.name}
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
                  src={GHOSTTY_ICONS.find(i => i.id === currentIcon)?.image || "/icons/official.png"}
                  alt="Selected icon"
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
              <div>
                <h4 className="font-medium">
                  {GHOSTTY_ICONS.find(i => i.id === currentIcon)?.name || "Official"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {GHOSTTY_ICONS.find(i => i.id === currentIcon)?.description || "The default Ghostty icon"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Config: <code className="px-1 py-0.5 bg-muted rounded">macos-icon = {currentIcon}</code>
                </p>
              </div>
            </div>
          </div>

          {/* Note */}
          <p className="mt-4 text-xs text-muted-foreground">
            Note: Icon changes require restarting Ghostty or reloading the config to take effect.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
