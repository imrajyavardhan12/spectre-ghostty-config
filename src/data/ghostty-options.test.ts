import { describe, it, expect } from 'vitest';
import { allOptions, getOptionById, getOptionsByCategory } from '@/data/ghostty-options';
import { categories } from '@/data/categories';
import type { Category } from '@/lib/schema/types';
import { isSafeConfigKey } from '@/lib/security/config-key-safety';

describe('ghostty-options', () => {
  describe('allOptions', () => {
    it('should have many options (regression check)', () => {
      expect(allOptions.length).toBeGreaterThan(100);
    });

    it('should have all required properties on each option', () => {
      for (const option of allOptions) {
        expect(option).toHaveProperty('id');
        expect(option).toHaveProperty('name');
        expect(option).toHaveProperty('description');
        expect(option).toHaveProperty('type');
        expect(option).toHaveProperty('default');
        expect(option).toHaveProperty('category');
      }
    });

    it('should have valid type values', () => {
      const validTypes = ['string', 'number', 'boolean', 'enum', 'color', 'palette', 'keybind', 'duration'];
      for (const option of allOptions) {
        expect(validTypes).toContain(option.type);
      }
    });

    it('should have options in all expected categories', () => {
      const categoryIds = categories.map(c => c.id);
      
      for (const catId of categoryIds) {
        // Each category should have at least one option
        const optionsInCategory = allOptions.filter(o => o.category === catId);
        expect(optionsInCategory.length).toBeGreaterThan(0);
      }
    });

    it('should have unique ids', () => {
      const ids = allOptions.map(o => o.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have safe Ghostty-style option ids', () => {
      for (const option of allOptions) {
        expect(isSafeConfigKey(option.id), option.id).toBe(true);
      }
    });
  });

  describe('getOptionById', () => {
    it('should find font-size option', () => {
      const option = getOptionById('font-size');
      expect(option).toBeDefined();
      expect(option?.name).toBe('Font Size');
    });

    it('should find theme option', () => {
      const option = getOptionById('theme');
      expect(option).toBeDefined();
      expect(option?.type).toBe('string');
    });

    it('should return undefined for non-existent option', () => {
      const option = getOptionById('non-existent-option');
      expect(option).toBeUndefined();
    });

    it('should find cursor-style option', () => {
      const option = getOptionById('cursor-style');
      expect(option).toBeDefined();
      expect(option?.type).toBe('enum');
    });

    it('should mark official repeatable path options as repeatable', () => {
      for (const id of ['config-file', 'custom-shader', 'gtk-custom-css']) {
        const option = getOptionById(id);
        expect(option, `${id} should exist`).toBeDefined();
        expect(option?.type, `${id} should be string-backed in Spectre`).toBe('string');
        expect('repeatable' in option! && option.repeatable, `${id} should be repeatable`).toBe(true);
      }
    });
  });

  describe('getOptionsByCategory', () => {
    it('should return fonts category options', () => {
      const fontsOptions = getOptionsByCategory('fonts');
      expect(fontsOptions.length).toBeGreaterThan(0);
      expect(fontsOptions.every(o => o.category === 'fonts')).toBe(true);
      expect(fontsOptions.some(o => o.id === 'font-family')).toBe(true);
      expect(fontsOptions.some(o => o.id === 'font-size')).toBe(true);
    });

    it('should return colors category options', () => {
      const colorsOptions = getOptionsByCategory('colors');
      expect(colorsOptions.length).toBeGreaterThan(0);
      expect(colorsOptions.every(o => o.category === 'colors')).toBe(true);
    });

    it('should return keybinds category options', () => {
      const keybindsOptions = getOptionsByCategory('keybinds');
      expect(keybindsOptions.length).toBeGreaterThan(0);
      expect(keybindsOptions.some(o => o.id === 'keybind')).toBe(true);
    });

    it('should return empty array for unknown category', () => {
      const unknownOptions = getOptionsByCategory('unknown-category' as Category);
      expect(unknownOptions).toEqual([]);
    });

    it('should have color options with color type', () => {
      const colorsOptions = getOptionsByCategory('colors');
      const colorOptions = colorsOptions.filter(o => o.type === 'color');
      expect(colorOptions.length).toBeGreaterThan(0);
    });

    it('should have enum options in cursor category', () => {
      const cursorOptions = getOptionsByCategory('cursor');
      const enumOptions = cursorOptions.filter(o => o.type === 'enum');
      expect(enumOptions.length).toBeGreaterThan(0);
    });
  });

  describe('option defaults', () => {
    it('should have valid defaults for string options', () => {
      const stringOptions = allOptions.filter(o => o.type === 'string');
      for (const option of stringOptions) {
        expect(typeof option.default).toBe('string');
      }
    });

    it('should have valid defaults and upstream kinds for number options', () => {
      const numberOptions = allOptions.filter(o => o.type === 'number');
      const numberKinds = ['float', 'signed-integer', 'unsigned-integer'];
      for (const option of numberOptions) {
        expect(typeof option.default).toBe('number');
        expect(numberKinds).toContain(option.numberKind);
        if (option.numberKind === 'float') {
          expect([32, 64]).toContain(option.floatBits);
        } else {
          expect([8, 16, 32, 64]).toContain(option.integerBits);
        }
      }
    });

    it('should have valid defaults for boolean options', () => {
      const booleanOptions = allOptions.filter(o => o.type === 'boolean');
      for (const option of booleanOptions) {
        expect(typeof option.default).toBe('boolean');
      }
    });

    it('font-size should have reasonable default', () => {
      const fontSize = getOptionById('font-size');
      expect(fontSize?.default).toBeGreaterThanOrEqual(4);
      expect(fontSize?.default).toBeLessThanOrEqual(128);
    });

    it('number options should have min/max if specified', () => {
      const numberOptions = allOptions.filter(o => o.type === 'number');
      for (const option of numberOptions) {
        if (option.min !== undefined && option.max !== undefined) {
          expect(option.default).toBeGreaterThanOrEqual(option.min);
          expect(option.default).toBeLessThanOrEqual(option.max);
        }
      }
    });
  });

  describe('platform-specific options', () => {
    it('should have platform-specific options', () => {
      const platformOptions = allOptions.filter(o => o.platform !== undefined);
      expect(platformOptions.length).toBeGreaterThan(0);
    });

    it('macos options should be marked correctly', () => {
      const macosOptions = allOptions.filter(o => o.platform?.includes('macos'));
      expect(macosOptions.length).toBeGreaterThan(0);
    });
  });
});

describe('categories', () => {
  it('should have unique category ids', () => {
    const ids = categories.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have all expected categories', () => {
    const expectedIds = [
      'fonts', 'colors', 'window', 'cursor', 'mouse', 'clipboard',
      'keybinds', 'shell', 'application', 'quick-terminal',
      'macos', 'linux', 'advanced'
    ];
    const categoryIds = categories.map(c => c.id);
    expect(categoryIds).toEqual(expect.arrayContaining(expectedIds));
  });

  it('should have names for all categories', () => {
    for (const category of categories) {
      expect(category.name).toBeTruthy();
      expect(category.name.length).toBeGreaterThan(0);
    }
  });

  it('should have icons for all categories', () => {
    for (const category of categories) {
      expect(category.icon).toBeTruthy();
    }
  });

  it('should have 13 categories', () => {
    expect(categories).toHaveLength(13);
  });
});
