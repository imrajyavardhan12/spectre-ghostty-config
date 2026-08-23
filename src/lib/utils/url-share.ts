import LZString from "lz-string";
import { ConfigValues } from "@/lib/store/config-store";
import {
  validateSharedConfig,
  validateSharedThemeName,
} from "@/lib/security/validate-shared-config";

export interface ShareableConfig {
  config: ConfigValues;
  theme?: string | null;
  version?: number;
}

const CURRENT_VERSION = 1;
const DEFAULT_SHARE_SLUG = "custom-config";
const MAX_SHARE_SLUG_LENGTH = 64;
const MAX_SHARE_SLUG_INPUT_LENGTH = 256;
const DEFAULT_BASE_URL = "https://spectre-ghostty-config.vercel.app";

export function generateShareSlug(label?: string | null): string {
  if (!label) return DEFAULT_SHARE_SLUG;

  const slug = label
    .slice(0, MAX_SHARE_SLUG_INPUT_LENGTH)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SHARE_SLUG_LENGTH)
    .replace(/-+$/g, "");

  return slug || DEFAULT_SHARE_SLUG;
}

export function encodeConfig(config: ConfigValues, themeName?: string | null): string {
  const data: ShareableConfig = {
    config,
    version: CURRENT_VERSION,
  };
  
  if (themeName) {
    data.theme = themeName;
  }

  const json = JSON.stringify(data);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return compressed;
}

export function decodeConfig(encoded: string): ShareableConfig | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return null;
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const raw = parsed as { config?: unknown; theme?: unknown };
    const { config } = validateSharedConfig(raw.config);
    const theme = validateSharedThemeName(raw.theme) ?? null;

    // If validation stripped every key and there's no usable theme, the
    // payload is effectively empty. Return null so the share page can
    // surface its "Invalid or corrupted share link" error instead of
    // rendering a misleading "0 settings configured" empty config.
    if (Object.keys(config).length === 0 && theme === null) {
      return null;
    }

    return { config, theme };
  } catch {
    return null;
  }
}

export function generateShareUrl(config: ConfigValues, themeName?: string | null): string {
  const encoded = encodeConfig(config, themeName);
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : DEFAULT_BASE_URL;
  const url = new URL(`/share/${generateShareSlug(themeName)}`, baseUrl);
  url.searchParams.set("c", encoded);
  return url.toString();
}

export function getConfigFromUrl(searchParams: URLSearchParams): ShareableConfig | null {
  const encoded = searchParams.get("c");
  if (!encoded) return null;
  return decodeConfig(encoded);
}
