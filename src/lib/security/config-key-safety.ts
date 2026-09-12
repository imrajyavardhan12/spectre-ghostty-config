// Ghostty 1.3.1 public Config.zig fields and reference anchors use lowercase
// ASCII segments separated by single hyphens. Future keys stay within that
// published shape before Spectre retains them as unverified values.
const GHOSTTY_OPTION_NAME_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

const UNSAFE_CONFIG_KEYS = new Set([
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
  "__proto__",
  "constructor",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "prototype",
  "toLocaleString",
  "toString",
  "valueOf",
]);

export function isUnsafeConfigKey(key: string): boolean {
  return UNSAFE_CONFIG_KEYS.has(key);
}

export function isSafeConfigKey(key: string): boolean {
  return GHOSTTY_OPTION_NAME_PATTERN.test(key) && !isUnsafeConfigKey(key);
}
