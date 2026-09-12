import type { ConfigValues } from "@/lib/schema/types";
import { analyzeGhosttyConfig } from "@/lib/utils/config-import-analysis";

/**
 * Compatibility wrapper for callers that only need parsed candidate values.
 * User-facing imports should review the full analysis before applying it.
 */
export function parseGhosttyConfig(configString: string): ConfigValues {
  return analyzeGhosttyConfig(configString).candidateConfig;
}
