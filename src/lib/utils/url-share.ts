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

    return {
      config,
      theme: validateSharedThemeName(raw.theme) ?? null,
    };
  } catch {
    return null;
  }
}

export function generateShareUrl(config: ConfigValues, themeName?: string | null): string {
  const encoded = encodeConfig(config, themeName);
  const baseUrl = typeof window !== "undefined" 
    ? window.location.origin 
    : "https://spectre.dev";
  return `${baseUrl}/share?c=${encoded}`;
}

export function getConfigFromUrl(searchParams: URLSearchParams): ShareableConfig | null {
  const encoded = searchParams.get("c");
  if (!encoded) return null;
  return decodeConfig(encoded);
}
