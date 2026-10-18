import type { ConfigOption } from "@/lib/schema/types";

/**
 * The text after "Default" in a setting row, or null when the row shouldn't show one
 * (empty defaults, lists, palettes and keybinds).
 */
export function formatDefaultText(option: ConfigOption): string | null {
  switch (option.type) {
    case "boolean":
      return option.default ? "on" : "off";
    case "number":
      return String(option.default);
    case "string":
      if (option.repeatable || option.default === "") return null;
      return option.id === "selection-word-chars"
        ? JSON.stringify(option.default)
        : option.default;
    case "enum":
      // Show the label the control shows, e.g. "None" for a default of "false".
      return (
        option.options.find((choice) => choice.value === option.default)?.label ??
        (option.default === "" ? null : option.default)
      );
    case "color":
    case "duration":
      return option.default === "" ? null : option.default;
    default:
      return null;
  }
}
