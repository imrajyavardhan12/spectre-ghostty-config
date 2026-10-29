import { allOptions } from "@/data/ghostty-options";

export const PATH_OPTION_IDS = new Set([
  "background-image",
  "bell-audio-path",
  "config-file",
  "custom-shader",
  "gtk-custom-css",
]);

const optionsById = new Map(allOptions.map((opt) => [opt.id, opt] as const));

export function getConfigOption(key: string) {
  return optionsById.get(key);
}

const renamedKeys = new Map(
  allOptions.flatMap((opt) => (opt.renamed ? [[opt.renamed.from, opt.id] as const] : []))
);

/**
 * The current option id for a key Ghostty has renamed (`scrollback-limit` is now
 * `scrollback-limit-bytes`); any other key comes back unchanged. Ghostty still
 * accepts the old key, so configs, share links and saved state that use it are
 * read as the new one.
 */
export function resolveRenamedKey(key: string): string {
  return renamedKeys.get(key) ?? key;
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
