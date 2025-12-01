"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SettingWrapper } from "./SettingWrapper";
import { useConfigStore } from "@/lib/store/config-store";
import { PaletteOption } from "@/lib/schema/types";

interface PaletteInputProps {
  option: PaletteOption;
}

const DEFAULT_PALETTE = [
  // Normal colors (0-7)
  "#000000", "#cc0000", "#4e9a06", "#c4a000",
  "#3465a4", "#75507b", "#06989a", "#d3d7cf",
  // Bright colors (8-15)
  "#555753", "#ef2929", "#8ae234", "#fce94f",
  "#729fcf", "#ad7fa8", "#34e2e2", "#eeeeec",
];

const COLOR_NAMES = [
  "Black", "Red", "Green", "Yellow",
  "Blue", "Magenta", "Cyan", "White",
  "Bright Black", "Bright Red", "Bright Green", "Bright Yellow",
  "Bright Blue", "Bright Magenta", "Bright Cyan", "Bright White",
];

export function PaletteInput({ option }: PaletteInputProps) {
  const { getValue, setValue, resetValue, isModified } = useConfigStore();
  const value = (getValue(option.id) as string[]) || [];
  const modified = isModified(option.id);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const getColor = (index: number): string => {
    return value[index] || DEFAULT_PALETTE[index] || "#000000";
  };

  const setColor = (index: number, color: string) => {
    const newPalette = [...value];
    // Ensure array is long enough
    while (newPalette.length <= index) {
      newPalette.push("");
    }
    newPalette[index] = color;
    setValue(option.id, newPalette);
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
        {/* Normal Colors */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Normal Colors (0-7)
          </p>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
              <PaletteColorButton
                key={index}
                index={index}
                color={getColor(index)}
                name={COLOR_NAMES[index]}
                isEditing={editingIndex === index}
                onEdit={() => setEditingIndex(index)}
                onClose={() => setEditingIndex(null)}
                onChange={(color) => setColor(index, color)}
              />
            ))}
          </div>
        </div>

        {/* Bright Colors */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Bright Colors (8-15)
          </p>
          <div className="flex flex-wrap gap-2">
            {[8, 9, 10, 11, 12, 13, 14, 15].map((index) => (
              <PaletteColorButton
                key={index}
                index={index}
                color={getColor(index)}
                name={COLOR_NAMES[index]}
                isEditing={editingIndex === index}
                onEdit={() => setEditingIndex(index)}
                onClose={() => setEditingIndex(null)}
                onChange={(color) => setColor(index, color)}
              />
            ))}
          </div>
        </div>
      </div>
    </SettingWrapper>
  );
}

interface PaletteColorButtonProps {
  index: number;
  color: string;
  name: string;
  isEditing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onChange: (color: string) => void;
}

function PaletteColorButton({
  index,
  color,
  name,
  isEditing,
  onEdit,
  onClose,
  onChange,
}: PaletteColorButtonProps) {
  return (
    <Popover open={isEditing} onOpenChange={(open) => !open && onClose()}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 w-10 p-0 relative group"
          style={{ backgroundColor: color }}
          onClick={onEdit}
        >
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {index}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-2">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">Palette index: {index}</p>
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="h-24 w-24 cursor-pointer rounded border-0"
          />
          <Input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="font-mono text-sm"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
