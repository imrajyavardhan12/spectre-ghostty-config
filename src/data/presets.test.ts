import { describe, it, expect } from 'vitest';
import { presets, getPresetsByCategory, searchPresets, presetCategories, type ConfigPreset } from '@/data/presets';
import { allOptions } from '@/data/ghostty-options';
import type { ConfigOption, StringOption } from '@/lib/schema/types';
import { validateKeybind } from '@/lib/utils/keybind-validation';

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
      const validCategories: ConfigPreset['category'][] = ['starter', 'workflow', 'aesthetic', 'performance'];
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

    it('should return performance presets', () => {
      const performancePresets = getPresetsByCategory('performance');
      expect(performancePresets.length).toBeGreaterThan(0);
      expect(performancePresets.every(p => p.category === 'performance')).toBe(true);
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
    it('should have 4 categories', () => {
      expect(presetCategories).toHaveLength(4);
    });

    it('should have unique ids', () => {
      const ids = presetCategories.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all expected category ids', () => {
      const expectedIds = ['starter', 'workflow', 'aesthetic', 'performance'];
      const categoryIds = presetCategories.map(c => c.id);
      expect(categoryIds).toEqual(expect.arrayContaining(expectedIds));
    });

    it('should have descriptions for all categories', () => {
      for (const category of presetCategories) {
        expect(category.description).toBeTruthy();
      }
    });
  });

  describe('specific presets', () => {
    it('minimal preset should have reasonable font-size', () => {
      const minimal = presets.find(p => p.id === 'minimal');
      expect(minimal?.config['font-size']).toBe(14);
    });

    it('developer preset should have font-feature for ligatures', () => {
      const developer = presets.find(p => p.id === 'developer');
      expect(developer?.config['font-feature']).toContain('liga');
    });

    it('poweruser preset should have keybinds', () => {
      const poweruser = presets.find(p => p.id === 'poweruser');
      expect(poweruser?.config['keybind']).toBeDefined();
      expect(Array.isArray(poweruser?.config['keybind'])).toBe(true);
    });

    it('retro preset should have green colors', () => {
      const retro = presets.find(p => p.id === 'retro');
      expect(retro?.config['foreground']).toBe('#33ff33');
    });

    it('presentation preset should have large font-size', () => {
      const presentation = presets.find(p => p.id === 'presentation');
      expect(presentation?.config['font-size']).toBeGreaterThanOrEqual(20);
    });
  });
});

describe('presets integration with config store', () => {
  it('minimal preset should be loadable into config format', () => {
    const minimal = presets.find(p => p.id === 'minimal');
    expect(minimal).toBeDefined();

    // Verify config structure matches what config-store expects
    const config = minimal!.config;
    expect(typeof config['font-size']).toBe('number');
    expect(typeof config['window-padding-x']).toBe('string');
  });

  it('poweruser keybinds should be valid keybind format', () => {
    const poweruser = presets.find(p => p.id === 'poweruser');
    const keybinds = poweruser?.config['keybind'] as string[] | undefined;
    expect(keybinds).toBeDefined();
    
    for (const keybind of keybinds!) {
      expect(keybind).toContain('=');
      const [trigger, action] = keybind.split('=');
      expect(trigger.length).toBeGreaterThan(0);
      expect(action.length).toBeGreaterThan(0);
    }
  });
});
