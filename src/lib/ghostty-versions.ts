import type { ConfigOption, EnumChoice, EnumOption } from "@/lib/schema/types";
import { GHOSTTY_BUILTIN_THEMES_ADDED_IN } from "@/data/ghostty-builtin-themes";
import { resolvePreviewThemeName } from "@/lib/ghostty/preview-theme";
import { getConfigOption } from "@/lib/utils/config-options";

/** Baseline Ghostty release: options without sinceVersion metadata date to 1.0. */
export const GHOSTTY_BASELINE_VERSION = "1.0.0";

import { GHOSTTY_RELEASES, type GhosttyRelease } from "@/lib/ghostty-releases";

export { GHOSTTY_RELEASES, type GhosttyRelease };

export function isKnownGhosttyRelease(version: string): version is GhosttyRelease {
  return (GHOSTTY_RELEASES as readonly string[]).includes(version);
}

/** "1.3.0" reads as "1.3"; a patch release keeps its number. */
export function shortGhosttyVersion(version: string): string {
  return version.replace(/\.0$/, "");
}

/** Numeric major.minor.patch comparison: negative when a < b, positive when a > b. */
export function compareGhosttyVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

/** Release that introduced the option; absent metadata means the 1.0 baseline. */
export function getOptionIntroducedIn(optionId: string): string {
  return getConfigOption(optionId)?.sinceVersion ?? GHOSTTY_BASELINE_VERSION;
}

/**
 * Whether the option exists in the given Ghostty target version.
 * Unknown option IDs are treated as supported: absence from the schema is a
 * forward-compatibility question, not a version question.
 *
 * @param targetVersion must be a known release (see isKnownGhosttyRelease);
 *   anything else degrades to unsupported for every option.
 */
export function isOptionSupportedIn(optionId: string, targetVersion: string): boolean {
  return compareGhosttyVersions(targetVersion, getOptionIntroducedIn(optionId)) >= 0;
}

export interface VersionSupportSplit {
  supported: ConfigOption[];
  unsupported: ConfigOption[];
}

/** Partition options by target support. Unknown IDs land in supported. */
export function splitOptionsBySupport(options: ConfigOption[], targetVersion: string): VersionSupportSplit {
  const supported: ConfigOption[] = [];
  const unsupported: ConfigOption[] = [];
  for (const option of options) {
    (isOptionSupportedIn(option.id, targetVersion) ? supported : unsupported).push(option);
  }
  return { supported, unsupported };
}

/**
 * The key to write for an option in a config meant for `targetVersion`.
 * Releases before a rename only know the old key, so `scrollback-limit-bytes`
 * is written as `scrollback-limit` for a 1.3 target.
 */
export function getOptionKeyForTarget(optionId: string, targetVersion: string): string {
  const renamed = getConfigOption(optionId)?.renamed;
  return renamed && compareGhosttyVersions(targetVersion, renamed.in) < 0 ? renamed.from : optionId;
}

/** Release that introduced an enum value, or undefined when it has been there all along. */
export function getChoiceIntroducedIn(optionId: string, value: unknown): string | undefined {
  const option = getConfigOption(optionId);
  if (option?.type !== "enum") return undefined;
  return option.options.find((choice) => choice.value === value)?.sinceVersion;
}

/** Whether the enum value exists in the target. Unknown options and values count as supported. */
export function isChoiceSupportedIn(optionId: string, value: unknown, targetVersion: string): boolean {
  const since = getChoiceIntroducedIn(optionId, value);
  return since === undefined || compareGhosttyVersions(targetVersion, since) >= 0;
}

/**
 * The choices to offer for an enum option on this target. Values newer than the
 * target are labelled with the release that adds them, or left out when newer
 * options are hidden. Values the target has already superseded are left out too,
 * except for the one currently selected, so a saved config never shows a blank.
 */
export function getVisibleChoices(
  option: EnumOption,
  targetVersion: string,
  hideUnsupported: boolean,
  currentValue: unknown
): EnumChoice[] {
  const choices: EnumChoice[] = [];
  for (const choice of option.options) {
    if (choice.value !== currentValue) {
      if (choice.deprecatedIn && compareGhosttyVersions(targetVersion, choice.deprecatedIn) >= 0) continue;
      if (choice.sinceVersion && compareGhosttyVersions(targetVersion, choice.sinceVersion) < 0 && hideUnsupported) continue;
    }
    const newer = choice.sinceVersion && compareGhosttyVersions(targetVersion, choice.sinceVersion) < 0;
    choices.push(newer ? { ...choice, label: `${choice.label} (${shortGhosttyVersion(choice.sinceVersion!)}+)` } : choice);
  }
  return choices;
}

/** Release that added a built-in theme; undefined when it is older than the one the list tracks. */
export function getThemeIntroducedIn(name: string): string | undefined {
  return Object.hasOwn(GHOSTTY_BUILTIN_THEMES_ADDED_IN, name) ? GHOSTTY_BUILTIN_THEMES_ADDED_IN[name] : undefined;
}

/** Whether every built-in theme named by a `theme` value exists in the target. File paths and custom names count as supported. */
export function isThemeValueSupportedIn(value: unknown, targetVersion: string): boolean {
  return [true, false].every((prefersDark) => {
    const name = resolvePreviewThemeName(value, prefersDark);
    const since = name === null ? undefined : getThemeIntroducedIn(name);
    return since === undefined || compareGhosttyVersions(targetVersion, since) >= 0;
  });
}
