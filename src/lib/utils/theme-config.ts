export const THEME_CONFIG_KEYS = [
  "theme",
  "background",
  "foreground",
  "cursor-color",
  "cursor-text",
  "selection-background",
  "selection-foreground",
  "palette",
] as const;

const THEME_CONFIG_KEY_SET: ReadonlySet<string> = new Set(THEME_CONFIG_KEYS);

export function isThemeConfigKey(key: string): boolean {
  return THEME_CONFIG_KEY_SET.has(key);
}
