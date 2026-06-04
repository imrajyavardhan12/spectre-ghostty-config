import { allOptions } from "@/data/ghostty-options";

export const PATH_OPTION_IDS = new Set([
  "background-image",
  "bell-audio-path",
  "config-file",
  "custom-shader",
  "gtk-custom-css",
]);

export function getConfigOption(key: string) {
  return allOptions.find((opt) => opt.id === key);
}

export function getDefaultValue(key: string): unknown {
  return getConfigOption(key)?.default;
}

export function isPathOption(key: string): boolean {
  return PATH_OPTION_IDS.has(key);
}

export function isRepeatableOption(key: string): boolean {
  const option = getConfigOption(key);
  if (!option) return false;

  return (
    option.type === "keybind" ||
    option.type === "palette" ||
    ("repeatable" in option && option.repeatable === true)
  );
}
