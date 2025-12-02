import LZString from "lz-string";
import { ConfigValues } from "@/lib/store/config-store";

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
    
    const data = JSON.parse(json) as ShareableConfig;
    
    if (!data.config || typeof data.config !== "object") {
      return null;
    }
    
    return data;
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
