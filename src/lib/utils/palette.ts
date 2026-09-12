// Utilities for Ghostty palette entries.
// Source of truth: https://ghostty.org/docs/config/reference#palette
// Ghostty syntax is `N=COLOR`, where N is 0-255 and may be decimal,
// binary (`0b`), octal (`0o`), or hexadecimal (`0x`).

export interface ParsedPaletteEntry {
  index: number;
  color: string;
}

export type PaletteEntryParseResult =
  | { status: "valid"; entry: ParsedPaletteEntry }
  | { status: "missing-separator" }
  | { status: "invalid-index" }
  | { status: "empty-color" };

const HEX_COLOR_WITHOUT_HASH = /^[0-9a-f]{6}$/i;
const MIN_PALETTE_INDEX = 0;
const MAX_PALETTE_INDEX = 255;

function parsePaletteIndex(rawIndex: string): number | null {
  let token = rawIndex.trim().toLowerCase();
  let negative = false;
  if (token.startsWith("+") || token.startsWith("-")) {
    negative = token[0] === "-";
    token = token.slice(1);
  }

  let base = 10;
  let digitPattern = /^[0-9]+$/;
  if (token.startsWith("0b")) {
    base = 2;
    digitPattern = /^[01]+$/;
    token = token.slice(2);
  } else if (token.startsWith("0o")) {
    base = 8;
    digitPattern = /^[0-7]+$/;
    token = token.slice(2);
  } else if (token.startsWith("0x")) {
    base = 16;
    digitPattern = /^[0-9a-f]+$/;
    token = token.slice(2);
  }

  if (!token || token.startsWith("_") || token.endsWith("_")) return null;
  const digits = token.replaceAll("_", "");
  if (!digitPattern.test(digits)) return null;

  const parsed = parseInt(digits, base);
  if (negative && parsed !== 0) return null;
  return parsed;
}

export function normalizePaletteColor(color: string): string {
  const trimmed = color.trim();
  return HEX_COLOR_WITHOUT_HASH.test(trimmed) ? `#${trimmed}` : trimmed;
}

export function parsePaletteEntryDetailed(entry: string): PaletteEntryParseResult {
  const equalsIndex = entry.indexOf("=");
  if (equalsIndex === -1) return { status: "missing-separator" };

  const rawIndex = entry.slice(0, equalsIndex);
  const rawColor = entry.slice(equalsIndex + 1);
  const index = parsePaletteIndex(rawIndex);
  if (index === null || index < MIN_PALETTE_INDEX || index > MAX_PALETTE_INDEX) {
    return { status: "invalid-index" };
  }

  const color = normalizePaletteColor(rawColor);
  if (!color) return { status: "empty-color" };

  return { status: "valid", entry: { index, color } };
}

export function parsePaletteEntry(entry: string): ParsedPaletteEntry | null {
  const result = parsePaletteEntryDetailed(entry);
  return result.status === "valid" ? result.entry : null;
}

export function normalizePaletteEntries(entries: string[]): string[] {
  return entries.flatMap((entry, position) => {
    const trimmed = entry.trim();
    if (!trimmed) return [];

    const parsed = parsePaletteEntry(trimmed);
    if (parsed) {
      return [`${parsed.index}=${parsed.color}`];
    }

    // Backwards compatibility for the old editor representation, which stored
    // palette colors positionally as raw colors without `N=`.
    if (!trimmed.includes("=") && position <= MAX_PALETTE_INDEX) {
      return [`${position}=${normalizePaletteColor(trimmed)}`];
    }

    return [trimmed];
  });
}

export function getPaletteColor(entries: string[], index: number): string | undefined {
  const normalizedEntries = normalizePaletteEntries(entries);

  for (let i = normalizedEntries.length - 1; i >= 0; i--) {
    const parsed = parsePaletteEntry(normalizedEntries[i]);
    if (parsed?.index === index) {
      return parsed.color;
    }
  }

  return undefined;
}

export function setPaletteColor(entries: string[], index: number, color: string): string[] {
  const normalizedEntries = normalizePaletteEntries(entries);
  const normalizedColor = normalizePaletteColor(color);
  let didReplace = false;
  const next: string[] = [];

  for (const entry of normalizedEntries) {
    const parsed = parsePaletteEntry(entry);

    if (parsed?.index !== index) {
      next.push(entry);
      continue;
    }

    if (!didReplace && normalizedColor) {
      next.push(`${index}=${normalizedColor}`);
      didReplace = true;
    }
  }

  if (!didReplace && normalizedColor) {
    next.push(`${index}=${normalizedColor}`);
  }

  return next;
}
