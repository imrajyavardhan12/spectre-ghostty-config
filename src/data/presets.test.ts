import { describe, it, expect } from 'vitest';
import { presets, getPresetsByCategory, searchPresets, presetCategories, type ConfigPreset } from '@/data/presets';
import { allOptions } from '@/data/ghostty-options';
import type { ConfigOption, StringOption } from '@/lib/schema/types';
import { validateKeybind } from '@/lib/utils/keybind-validation';
import { validateConfigValue } from '@/lib/utils/config-validation';
import { normalizeConfigValues } from '@/lib/utils/config-normalization';
import { analyzeKeybindConflicts, findDefaultKeybindOverrides } from '@/lib/utils/keybind-conflicts';
import { GHOSTTY_DEFAULT_KEYBINDS } from '@/data/ghostty-default-keybinds';
import { GHOSTTY_BUILTIN_THEMES } from '@/data/ghostty-builtin-themes';

function getPresetValueValidationError(option: ConfigOption, value: unknown): string | null {
  const typeName = Array.isArray(value) ? 'array' : typeof value;

  switch (option.type) {
    case 'string': {
      if (typeof value === 'string') return null;
      const stringOption = option as StringOption;
      if (stringOption.repeatable && Array.isArray(value) && value.every(item => typeof item === 'string')) {
        return null;
      }
      return `expected string${stringOption.repeatable ? ' or string[]' : ''}, received ${typeName}`;
    }
    case 'color':
    case 'duration':
      return typeof value === 'string' ? null : `expected string, received ${typeName}`;
    case 'number':
      return typeof value === 'number' ? null : `expected number, received ${typeName}`;
    case 'boolean':
      return typeof value === 'boolean' ? null : `expected boolean, received ${typeName}`;
    case 'enum': {
      if (typeof value !== 'string') return `expected string enum value, received ${typeName}`;
      const allowedValues = new Set(option.options.map(item => item.value));
      return allowedValues.has(value)
        ? null
        : `expected one of ${Array.from(allowedValues).join(', ')}, received ${value}`;
    }
    case 'palette':
    case 'keybind':
      return Array.isArray(value) && value.every(item => typeof item === 'string')
        ? null
        : `expected string[], received ${typeName}`;
    default:
      return `unsupported option type ${(option as ConfigOption).type}`;
  }
}

describe('presets', () => {
  describe('presets array', () => {
    it('should have multiple presets', () => {
      expect(presets.length).toBeGreaterThan(5);
    });

    it('should have unique ids', () => {
      const ids = presets.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required properties', () => {
      for (const preset of presets) {
        expect(preset).toHaveProperty('id');
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('icon');
        expect(preset).toHaveProperty('category');
        expect(preset).toHaveProperty('config');
        expect(preset).toHaveProperty('tags');
      }
    });

    it('should have valid categories', () => {
      const validCategories: ConfigPreset['category'][] = ['starter', 'workflow', 'aesthetic'];
      for (const preset of presets) {
        expect(validCategories).toContain(preset.category);
      }
    });

    it('should have non-empty config objects', () => {
      for (const preset of presets) {
        expect(Object.keys(preset.config).length).toBeGreaterThan(0);
      }
    });

    it('should have non-empty tags', () => {
      for (const preset of presets) {
        expect(preset.tags.length).toBeGreaterThan(0);
      }
    });

    it('should only use known Ghostty options with schema-compatible values', () => {
      const optionsById = new Map(allOptions.map(option => [option.id, option]));

      for (const preset of presets) {
        for (const [key, value] of Object.entries(preset.config)) {
          const option = optionsById.get(key);
          expect(option, `${preset.id} uses unknown option "${key}"`).toBeDefined();
          if (!option) continue;

          const validationError = getPresetValueValidationError(option, value);
          expect(validationError, `${preset.id}.${key}: ${validationError}`).toBeNull();
        }
      }
    });

    it('should contain valid keybind definitions', () => {
      for (const preset of presets) {
        const keybinds = preset.config.keybind;
        if (!Array.isArray(keybinds)) continue;

        for (const keybind of keybinds) {
          const result = validateKeybind(keybind);
          expect(result.errors, `${preset.id} keybind "${keybind}" should be valid`).toEqual([]);
        }
      }
    });
  });

  describe('getPresetsByCategory', () => {
    it('should return starter presets', () => {
      const starterPresets = getPresetsByCategory('starter');
      expect(starterPresets.length).toBeGreaterThan(0);
      expect(starterPresets.every(p => p.category === 'starter')).toBe(true);
    });

    it('should return workflow presets', () => {
      const workflowPresets = getPresetsByCategory('workflow');
      expect(workflowPresets.length).toBeGreaterThan(0);
      expect(workflowPresets.every(p => p.category === 'workflow')).toBe(true);
    });

    it('should return aesthetic presets', () => {
      const aestheticPresets = getPresetsByCategory('aesthetic');
      expect(aestheticPresets.length).toBeGreaterThan(0);
      expect(aestheticPresets.every(p => p.category === 'aesthetic')).toBe(true);
    });

    it('should return empty array for unknown category', () => {
      const unknownPresets = getPresetsByCategory('unknown' as ConfigPreset['category']);
      expect(unknownPresets).toEqual([]);
    });
  });

  describe('searchPresets', () => {
    it('should find presets by name', () => {
      const results = searchPresets('minimal');
      expect(results.some(p => p.id === 'minimal')).toBe(true);
    });

    it('should find presets by description', () => {
      const results = searchPresets('coding');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find presets by tags', () => {
      const results = searchPresets('beginner');
      expect(results.some(p => p.tags.includes('beginner'))).toBe(true);
    });

    it('should be case insensitive', () => {
      const results = searchPresets('DEVELOPER');
      expect(results.some(p => p.id === 'developer')).toBe(true);
    });

    it('should return empty for no matches', () => {
      const results = searchPresets('xyznonexistent123');
      expect(results).toHaveLength(0);
    });
  });

  describe('presetCategories', () => {
    it('should have unique ids', () => {
      const ids = presetCategories.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should cover every category used by a preset', () => {
      const categoryIds = presetCategories.map(c => c.id);
      expect(categoryIds).toEqual(['starter', 'workflow', 'aesthetic']);
      for (const preset of presets) expect(categoryIds).toContain(preset.category);
    });

    it('should have descriptions for all categories', () => {
      for (const category of presetCategories) {
        expect(category.description).toBeTruthy();
      }
    });
  });

  describe('specific presets', () => {
    it('leader keys send ctrl+a to the shell when pressed twice', () => {
      const leader = presets.find(p => p.id === 'leader-keys');
      expect(leader?.config.keybind).toContain('ctrl+a>ctrl+a=text:\\x01');
    });

    it('auto light/dark presets name both themes', () => {
      for (const id of ['rose-pine', 'catppuccin']) {
        const theme = presets.find(p => p.id === id)?.config.theme as string;
        expect(theme).toMatch(/^light:[^,]+,dark:.+$/);
      }
    });

    it('presentation preset should have large font-size', () => {
      const presentation = presets.find(p => p.id === 'presentation');
      expect(presentation?.config['font-size']).toBeGreaterThanOrEqual(20);
    });
  });
});

// The rules in docs/PRESETS.md. Every preset must pass all of them.
describe('preset quality gate', () => {
  const optionsById = new Map(allOptions.map(option => [option.id, option]));

  /** Theme names referenced by a `theme` value, including light:/dark: pairs. */
  function themeNames(value: string): string[] {
    if (!/(^|,)\s*(light|dark):/.test(value)) return [value.trim()];
    return value.split(',').map(part => part.replace(/^\s*(light|dark):/, '').trim());
  }

  for (const preset of presets) {
    describe(preset.id, () => {
      it('passes the editor validators for every value', () => {
        for (const [key, value] of Object.entries(preset.config)) {
          const option = optionsById.get(key)!;
          const result = validateConfigValue(option, value as never);
          expect(result.valid, `${key}: ${JSON.stringify(result)}`).toBe(true);
        }
      });

      it('sets no value equal to Ghostty\'s default', () => {
        const effective = normalizeConfigValues(preset.config);
        expect(Object.keys(preset.config).filter(key => !(key in effective))).toEqual([]);
      });

      it('uses keybinds that are valid, effective, and keep Ghostty\'s defaults', () => {
        const keybinds = (preset.config.keybind as string[] | undefined) ?? [];
        for (const keybind of keybinds) {
          expect(validateKeybind(keybind), keybind).toEqual({ valid: true, errors: [], warnings: [] });
        }
        expect(analyzeKeybindConflicts(keybinds)).toEqual([]);
        expect(findDefaultKeybindOverrides(keybinds, GHOSTTY_DEFAULT_KEYBINDS.macos)).toEqual([]);
        expect(findDefaultKeybindOverrides(keybinds, GHOSTTY_DEFAULT_KEYBINDS.linux)).toEqual([]);
      });

      it('only references themes bundled with the target Ghostty release', () => {
        const theme = preset.config.theme;
        if (theme === undefined) return;
        for (const name of themeNames(theme as string)) {
          expect(GHOSTTY_BUILTIN_THEMES, `theme "${name}"`).toContain(name);
        }
      });

      it('declares every font it uses, and only those', () => {
        const families = ['font-family', 'font-family-bold', 'font-family-italic', 'font-family-bold-italic']
          .flatMap(key => {
            const value = preset.config[key];
            return value === undefined ? [] : Array.isArray(value) ? value : [value];
          }) as string[];
        expect([...new Set(families)].sort()).toEqual([...preset.fonts].sort());
      });

      it('declares platforms when it uses platform-specific options', () => {
        for (const key of Object.keys(preset.config)) {
          const platforms = optionsById.get(key)!.platform;
          if (!platforms || platforms.length === 0) continue;
          expect(preset.platforms, `${key} is limited to ${platforms.join(', ')}`).toBeDefined();
          for (const platform of preset.platforms!) expect(platforms, key).toContain(platform);
        }
      });
    });
  }

  it('recognizes light/dark theme pairs', () => {
    expect(themeNames('light:Rose Pine Dawn,dark:Rose Pine')).toEqual(['Rose Pine Dawn', 'Rose Pine']);
    expect(themeNames('TokyoNight')).toEqual(['TokyoNight']);
  });
});
