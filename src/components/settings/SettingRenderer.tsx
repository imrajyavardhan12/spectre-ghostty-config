"use client";

import { ConfigOption } from "@/lib/schema/types";
import { TextInput } from "./TextInput";
import { NumberInput } from "./NumberInput";
import { SwitchInput } from "./SwitchInput";
import { SelectInput } from "./SelectInput";
import { ColorInput } from "./ColorInput";
import { PaletteInput } from "./PaletteInput";
import { KeybindInput } from "./KeybindInput";
import { DurationInput } from "./DurationInput";
import { IconInput } from "./IconInput";

interface SettingRendererProps {
  option: ConfigOption;
}

export function SettingRenderer({ option }: SettingRendererProps) {
  // Special case for macos-icon - use visual picker
  if (option.id === "macos-icon") {
    return <IconInput option={option} />;
  }

  switch (option.type) {
    case "string":
      return <TextInput option={option} />;
    case "number":
      return <NumberInput option={option} />;
    case "boolean":
      return <SwitchInput option={option} />;
    case "enum":
      return <SelectInput option={option} />;
    case "color":
      return <ColorInput option={option} />;
    case "palette":
      return <PaletteInput option={option} />;
    case "keybind":
      return <KeybindInput option={option} />;
    case "duration":
      return <DurationInput option={option} />;
    default:
      return (
        <div className="text-sm text-muted-foreground">
          Unsupported option type: {(option as ConfigOption).type}
        </div>
      );
  }
}
