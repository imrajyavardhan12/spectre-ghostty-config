"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingWrapper } from "./SettingWrapper";
import { IconPickerDialog } from "./IconPickerDialog";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { ConfigOption } from "@/lib/schema/types";

// Icon metadata for display
const ICON_INFO: Record<string, { name: string; image: string }> = {
  official: { name: "Official", image: "/icons/official.png" },
  blueprint: { name: "Blueprint", image: "/icons/blueprint.png" },
  chalkboard: { name: "Chalkboard", image: "/icons/chalkboard.png" },
  glass: { name: "Glass", image: "/icons/glass.png" },
  holographic: { name: "Holographic", image: "/icons/holographic.png" },
  microchip: { name: "Microchip", image: "/icons/microchip.png" },
  paper: { name: "Paper", image: "/icons/paper.png" },
  retro: { name: "Retro", image: "/icons/retro.png" },
  xray: { name: "X-Ray", image: "/icons/xray.png" },
};

interface IconInputProps {
  option: ConfigOption;
}

export function IconInput({ option }: IconInputProps) {
  const { getValue, resetValue } = useConfigStore();
  const value = (getValue(option.id) as string) || "official";
  const modified = useIsModified(option.id);
  
  const iconInfo = ICON_INFO[value] || ICON_INFO.official;

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
      <IconPickerDialog
        trigger={
          <Button
            variant="outline"
            className="w-full justify-between h-auto py-2 px-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={iconInfo.image}
                  alt={iconInfo.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{iconInfo.name}</div>
                <div className="text-xs text-muted-foreground">Click to change</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        }
      />
    </SettingWrapper>
  );
}
