"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingWrapper } from "./SettingWrapper";
import { FramePickerDialog } from "./FramePickerDialog";
import { useConfigStore, useIsModified } from "@/lib/store/config-store";
import { ConfigOption } from "@/lib/schema/types";

// Frame metadata for display
const FRAME_INFO: Record<string, { name: string; image: string }> = {
    aluminum: { name: "Aluminum", image: "/icons/frames/aluminum.png" },
    beige: { name: "Beige", image: "/icons/frames/beige.png" },
    plastic: { name: "Plastic", image: "/icons/frames/plastic.png" },
    chrome: { name: "Chrome", image: "/icons/frames/chrome.png" },
};

interface FrameInputProps {
    option: ConfigOption;
}

export function FrameInput({ option }: FrameInputProps) {
    const { getValue, resetValue } = useConfigStore();
    const value = (getValue(option.id) as string) || "aluminum";
    const modified = useIsModified(option.id);

    const frameInfo = FRAME_INFO[value] || FRAME_INFO.aluminum;

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
            <FramePickerDialog
                trigger={
                    <Button
                        variant="outline"
                        className="w-full justify-between h-auto py-2 px-3"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted">
                                <Image
                                    src={frameInfo.image}
                                    alt={frameInfo.name}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-sm">{frameInfo.name}</div>
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
