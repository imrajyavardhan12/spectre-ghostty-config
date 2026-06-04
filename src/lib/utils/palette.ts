// Utilities for Ghostty palette entries.
// Source of truth: https://ghostty.org/docs/config/reference#palette
// Ghostty syntax is `N=COLOR`, where N is 0-255 and may be decimal,
// binary (`0b`), octal (`0o`), or hexadecimal (`0x`).

export interface ParsedPaletteEntry {
  index: number;
  color: string;
}

const HEX_COLOR_WITHOUT_HASH = /^[0-9a-f]{6}$/i;
const MIN_PALETTE_INDEX = 0;
const MAX_PALETTE_INDEX = 255;

function parsePaletteIndex(rawIndex: string): number | null {
  const token = rawIndex.trim().toLowerCase();

  if (/^0b[01]+$/.test(token)) {
    return parseInt(token.slice(2), 2);
  }

  if (/^0o[0-7]+$/.test(token)) {
    return parseInt(token.slice(2), 8);
  }

  if (/^0x[0-9a-f]+$/.test(token)) {
    return parseInt(token.slice(2), 16);
  }

  if (/^\d+$/.test(token)) {
    return parseInt(token, 10);
  }

  return null;
}

export function normalizePaletteColor(color: string): string {
  const trimmed = color.trim();
  return HEX_COLOR_WITHOUT_HASH.test(trimmed) ? `#${trimmed}` : trimmed;
}

export function parsePaletteEntry(entry: string): ParsedPaletteEntry | null {
  const equalsIndex = entry.indexOf("=");
  if (equalsIndex === -1) return null;

  const rawIndex = entry.slice(0, equalsIndex);
  const rawColor = entry.slice(equalsIndex + 1);
  const index = parsePaletteIndex(rawIndex);
  const color = normalizePaletteColor(rawColor);

  if (index === null || index < MIN_PALETTE_INDEX || index > MAX_PALETTE_INDEX || !color) {
    return null;
  }

  return { index, color };
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
