import { describe, it, expect } from 'vitest';
import { presets, getPresetsByCategory, searchPresets, presetCategories, type ConfigPreset } from '@/data/presets';

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
    expect(typeof config['window-padding-x']).toBe('number');
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
