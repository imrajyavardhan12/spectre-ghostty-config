"use client";

import { useId } from "react";
import Image from "next/image";
import { getOptionById } from "@/data/ghostty-options";
import { useConfigStore } from "@/lib/store/config-store";
import { cn } from "@/lib/utils";
import { ColorField, toCssColor } from "./ColorField";
import { CustomIconPreview } from "./CustomIconPreview";

const FRAMES = [
  { id: "aluminum", name: "Aluminum" },
  { id: "beige", name: "Beige" },
  { id: "plastic", name: "Plastic" },
  { id: "chrome", name: "Chrome" },
] as const;

interface IconColorFieldProps {
  label: string;
  optionId: string;
  value: string;
  onChange: (color: string) => void;
}

function IconColorField({ label, optionId, value, onChange }: IconColorFieldProps) {
  const inputId = useId();
  const option = getOptionById(optionId);
  if (option?.type !== "color") return null;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-[13px] font-medium text-foreground">
        {label}
      </label>
      <ColorField option={option} id={inputId} label={label} value={value} onChange={onChange} />
    </div>
  );
}

/** The custom-style icon editor, shown inside the App Icon row while "Custom" is selected. */
export function CustomIconBuilder() {
  const { getValue, setValue } = useConfigStore();
  const frame = (getValue("macos-icon-frame") as string) || "aluminum";
  const ghostColor = (getValue("macos-icon-ghost-color") as string) || "";
  const screenColor = (getValue("macos-icon-screen-color") as string) || "";

  return (
    <div
      data-testid="custom-icon-builder"
      className="mt-4 flex flex-wrap items-start gap-x-6 gap-y-4 rounded-lg border border-border bg-muted/30 p-4"
    >
      <div className="mx-auto shrink-0 sm:mx-0">
        <CustomIconPreview
          frameId={frame}
          ghostColor={toCssColor(ghostColor)}
          screenColor={toCssColor(screenColor)}
          size={104}
        />
      </div>

      <div className="min-w-0 flex-[1_1_240px] space-y-4">
        <div className="space-y-1.5">
          <span id="custom-icon-frame-label" className="text-[13px] font-medium text-foreground">
            Frame
          </span>
          <div role="group" aria-labelledby="custom-icon-frame-label" className="grid grid-cols-4 gap-2">
            {FRAMES.map((option) => {
              const selected = frame === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setValue("macos-icon-frame", option.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-1.5 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-primary bg-accent text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="relative size-9">
                    <Image
                      src={`/icons/frames/${option.id}.png`}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-contain"
                    />
                  </span>
                  {option.name}
                </button>
              );
            })}
          </div>
        </div>

        <IconColorField
          label="Ghost color"
          optionId="macos-icon-ghost-color"
          value={ghostColor}
          onChange={(color) => setValue("macos-icon-ghost-color", color)}
        />
        <IconColorField
          label="Screen color"
          optionId="macos-icon-screen-color"
          value={screenColor}
          onChange={(color) => setValue("macos-icon-screen-color", color)}
        />
      </div>
    </div>
  );
}
