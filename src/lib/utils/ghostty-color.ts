import { X11_COLOR_NAMES } from "@/lib/utils/x11-colors";

// Ghostty's color grammar, as `RGB.parse` in src/terminal/color.zig reads it (Ghostty 1.4.0):
//
//   #rgb  #rrggbb  #rrrgggbbb  #rrrrggggbbbb   hex with a leading #
//   rgb   rrggbb                               the same two shorter forms without the #
//   rgb:<r>/<g>/<b>                            1 to 4 hex digits per channel
//   rgbi:<r>/<g>/<b>                           fractions from 0.0 to 1.0
//   an X11 color name
//
// Spaces and tabs around the value are ignored. Before 1.4.0 only the first two hex lengths
// (with or without #) and the names were accepted.

export interface GhosttyRgb {
  r: number;
  g: number;
  b: number;
}

export type GhosttyColorKind = "hex" | "bare-hex" | "rgb" | "rgbi" | "name";

export interface ParsedGhosttyColor {
  kind: GhosttyColorKind;
  /** The channels, except for a named color: the name's value isn't in Spectre's list. */
  rgb?: GhosttyRgb;
  /** True when only Ghostty 1.4.0 or newer reads this form. */
  needsGhostty14: boolean;
}

const HEX_GROUP = /^[0-9a-fA-F]{1,4}$/;
const HEX_DIVISOR = [0, 0xf, 0xff, 0xfff, 0xffff];

const isSpaceOrTab = (code: number) => code === 0x20 || code === 0x09;

/**
 * The value with the spaces and tabs Ghostty ignores taken off both ends. A form feed or a
 * no-break space around a color is not ignored, so it makes the color invalid. A loop rather
 * than a regex: `[ \t]+$` is quadratic on a long run of spaces inside the text.
 */
export function trimGhosttyColorText(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && isSpaceOrTab(value.charCodeAt(start))) start++;
  while (end > start && isSpaceOrTab(value.charCodeAt(end - 1))) end--;
  return value.slice(start, end);
}

/** Ghostty folds case for ASCII only, so "blacK" with a Kelvin sign is not "black" even though JS lowercases it. */
const lowerAscii = (text: string) => text.replace(/[A-Z]/g, (c) => c.toLowerCase());

/** One channel of 1 to 4 hex digits, scaled to 8 bits the way Ghostty does (integer division). */
function hexChannel(digits: string): number | null {
  if (!HEX_GROUP.test(digits)) return null;
  return Math.floor((parseInt(digits, 16) * 255) / HEX_DIVISOR[digits.length]);
}

/**
 * Ghostty's `fraction.parse`: an optional sign, digits with an optional `.`, no exponent, and a
 * value from 0 to 1 inclusive. Returns null for anything else.
 */
function parseFraction(text: string): number | null {
  let rest = text;
  let negative = false;
  if (rest.startsWith("+")) rest = rest.slice(1);
  else if (rest.startsWith("-")) {
    negative = true;
    rest = rest.slice(1);
  }

  const dot = rest.indexOf(".");
  const whole = dot === -1 ? rest : rest.slice(0, dot);
  const fraction = dot === -1 ? "" : rest.slice(dot + 1);
  if (!/^[0-9]*$/.test(whole) || !/^[0-9]*$/.test(fraction)) return null;
  if (whole.length + fraction.length === 0) return null;

  let intPart = 0;
  for (const digit of whole) intPart = intPart * 10 + Number(digit);

  // Ghostty keeps at most 15 fractional digits, but still requires every one to be a digit.
  let numerator = 0;
  let scale = 1;
  for (const digit of fraction) {
    if (scale >= 1e15) break;
    numerator = numerator * 10 + Number(digit);
    scale *= 10;
  }

  const magnitude = intPart + numerator / scale;
  const result = negative ? -magnitude : magnitude;
  return result >= 0 && result <= 1 ? result : null;
}

function intensityChannel(text: string): number | null {
  const fraction = parseFraction(text);
  return fraction === null ? null : Math.trunc(fraction * 255);
}

function parseChannels(
  groups: string[],
  channel: (text: string) => number | null
): GhosttyRgb | null {
  const [r, g, b] = groups.map(channel);
  return r === null || g === null || b === null ? null : { r, g, b };
}

/** What Ghostty makes of a color value, or null when it would reject it. */
export function parseGhosttyColor(value: string): ParsedGhosttyColor | null {
  const input = trimGhosttyColorText(value);
  if (input === "") return null;

  if (input.startsWith("#")) {
    const width = (input.length - 1) / 3;
    if (!Number.isInteger(width) || width < 1 || width > 4) return null;
    const groups = [0, 1, 2].map((i) => input.slice(1 + i * width, 1 + (i + 1) * width));
    const rgb = parseChannels(groups, hexChannel);
    return rgb && { kind: "hex", rgb, needsGhostty14: width > 2 };
  }

  if (X11_COLOR_NAMES.has(lowerAscii(input))) return { kind: "name", needsGhostty14: false };

  if (input.length === 3 || input.length === 6) {
    const width = input.length / 3;
    const groups = [0, 1, 2].map((i) => input.slice(i * width, (i + 1) * width));
    const rgb = parseChannels(groups, hexChannel);
    return rgb && { kind: "bare-hex", rgb, needsGhostty14: false };
  }

  if (input.length < "rgb:a/a/a".length || !input.startsWith("rgb")) return null;
  const intensity = input[3] === "i";
  if (input[intensity ? 4 : 3] !== ":") return null;

  const body = input.slice(intensity ? 5 : 4);
  const groups = body.split("/");
  // The last channel is everything after the second slash, so a third slash makes it invalid.
  if (groups.length !== 3) return null;
  const rgb = parseChannels(groups, intensity ? intensityChannel : hexChannel);
  return rgb && { kind: intensity ? "rgbi" : "rgb", rgb, needsGhostty14: true };
}

export function isGhosttyColorText(value: string): boolean {
  return parseGhosttyColor(value) !== null;
}

function toHex(channel: number): string {
  return channel.toString(16).padStart(2, "0");
}

/** "#rrggbb" for a color given as numbers; undefined for a name or anything Ghostty rejects. */
export function ghosttyColorToHex(value: string): string | undefined {
  const rgb = parseGhosttyColor(value)?.rgb;
  return rgb && `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/** Whether a color value uses a form that only Ghostty 1.4.0 and newer reads. */
export function colorNeedsGhostty14(value: string): boolean {
  return parseGhosttyColor(value)?.needsGhostty14 === true;
}

/**
 * A color as CSS reads it, for painting swatches, the preview window and theme cards:
 * every numeric form Ghostty reads (bare hex, rgb:, rgbi:, long hex) becomes #rrggbb.
 * Names, and anything that isn't a color, come back unchanged.
 */
export function toCssColor(color: string): string {
  return ghosttyColorToHex(color) ?? color;
}
