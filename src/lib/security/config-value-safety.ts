// Ghostty reads its config one `key = value` per line, so a value that
// carries a line break becomes additional config lines on export.
const LINE_BREAK_PATTERN = /[\n\r]/;

// Untrusted values (share links) are held to a stricter bar: no C0 control
// characters except tab, no DEL, and no characters that render as line
// breaks (NEL, LS, PS) and could visually split a value in previews.
const UNSAFE_UNTRUSTED_VALUE_PATTERN = /[\x00-\x08\x0a-\x1f\x7f\x85\u2028\u2029]/;

function someString(value: unknown, test: (entry: string) => boolean): boolean {
  if (typeof value === "string") return test(value);
  if (Array.isArray(value)) {
    return value.some((entry) => typeof entry === "string" && test(entry));
  }
  return false;
}

/** True when a string (or any string in an array) would split an exported config line. */
export function containsConfigLineBreak(value: unknown): boolean {
  return someString(value, (entry) => LINE_BREAK_PATTERN.test(entry));
}

/** True when a string (or any string in an array) is unsafe to accept from an untrusted source. */
export function containsUnsafeValueCharacters(value: unknown): boolean {
  return someString(value, (entry) => UNSAFE_UNTRUSTED_VALUE_PATTERN.test(entry));
}
