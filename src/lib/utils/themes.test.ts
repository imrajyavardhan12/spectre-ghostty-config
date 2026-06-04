import { describe, it, expect } from 'vitest';
import {
  parseThemeContent,
  themeToConfig,
  categorizeTheme,
  FEATURED_THEMES,
} from '@/lib/utils/themes';

describe('themes', () => {
  describe('parseThemeContent', () => {
    it('should parse minimal theme with background and foreground', () => {
      const content = `
background = #1a1b26
foreground = #c0caf5
`;
      const colors = parseThemeContent(content);

      expect(colors.background).toBe('#1a1b26');
      expect(colors.foreground).toBe('#c0caf5');
    });

    it('should parse cursor colors', () => {
      const content = `
background = #1a1b26
foreground = #c0caf5
cursor-color = #ffffff
cursor-text = #000000
`;
      const colors = parseThemeContent(content);

      expect(colors.cursorColor).toBe('#ffffff');
      expect(colors.cursorText).toBe('#000000');
    });

    it('should parse selection colors', () => {
      const content = `
selection-background = #364a82
selection-foreground = #ffffff
`;
      const colors = parseThemeContent(content);

      expect(colors.selectionBackground).toBe('#364a82');
      expect(colors.selectionForeground).toBe('#ffffff');
    });

    it('should parse palette entries', () => {
      const content = `
palette = 0=#15161e
palette = 1=#f7768e
palette = 2=#9ece6a
palette = 15=#c0caf5
`;
      const colors = parseThemeContent(content);

      expect(colors.palette[0]).toBe('#15161e');
      expect(colors.palette[1]).toBe('#f7768e');
      expect(colors.palette[2]).toBe('#9ece6a');
      expect(colors.palette[15]).toBe('#c0caf5');
    });

    it('should handle palette entries without # prefix', () => {
      const content = `
palette = 0=15161e
palette = 1=f7768e
`;
      const colors = parseThemeContent(content);

      expect(colors.palette[0]).toBe('#15161e');
      expect(colors.palette[1]).toBe('#f7768e');
    });

    it('should parse non-decimal palette indexes from Ghostty syntax', () => {
      const content = `
palette = 0b10=111111
palette = 0o10=222222
palette = 0xF=333333
`;
      const colors = parseThemeContent(content);

      expect(colors.palette[2]).toBe('#111111');
      expect(colors.palette[8]).toBe('#222222');
      expect(colors.palette[15]).toBe('#333333');
    });

    it('should skip comments', () => {
      const content = `
# This is a comment
background = #1a1b26
# Another comment
foreground = #c0caf5
`;
      const colors = parseThemeContent(content);

      expect(colors.background).toBe('#1a1b26');
      expect(colors.foreground).toBe('#c0caf5');
    });

    it('should skip empty lines', () => {
      const content = `

background = #1a1b26

foreground = #c0caf5

`;
      const colors = parseThemeContent(content);

      expect(colors.background).toBe('#1a1b26');
      expect(colors.foreground).toBe('#c0caf5');
    });

    it('should ignore invalid palette entries', () => {
      const content = `
palette = not_valid
palette = 0=#15161e
palette = invalid_index=abc
`;
      const colors = parseThemeContent(content);

      expect(colors.palette[0]).toBe('#15161e');
    });

    it('should ignore palette entries with out-of-range index', () => {
      const content = `
palette = 0=#000000
palette = 16=#ffffff
palette = -1=#ff0000
`;
      const colors = parseThemeContent(content);

      expect(colors.palette[0]).toBe('#000000');
      expect(colors.palette[16]).toBeUndefined();
      expect(colors.palette[15]).toBe(''); // default empty
    });

    it('should have empty palette array by default', () => {
      const colors = parseThemeContent('');
      
      expect(colors.palette).toHaveLength(16);
      expect(colors.palette.every(c => c === '')).toBe(true);
    });

    it('should default background and foreground', () => {
      const colors = parseThemeContent('');
      
      expect(colors.background).toBe('#000000');
      expect(colors.foreground).toBe('#ffffff');
    });
  });

  describe('themeToConfig', () => {
    it('should convert theme colors to config object', () => {
      const theme = {
        name: 'Test Theme',
        colors: {
          background: '#1a1b26',
          foreground: '#c0caf5',
          cursorColor: '#ffffff',
          palette: ['#15161e', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '#c0caf5'],
          raw: '',
        },
        raw: '',
      };

      const config = themeToConfig(theme);

      expect(config['background']).toBe('#1a1b26');
      expect(config['foreground']).toBe('#c0caf5');
      expect(config['cursor-color']).toBe('#ffffff');
    });

    it('should not include undefined colors', () => {
      const theme = {
        name: 'Minimal Theme',
        colors: {
          background: '#1a1b26',
          foreground: '#c0caf5',
          palette: ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
          raw: '',
        },
        raw: '',
      };

      const config = themeToConfig(theme);

      expect(config['cursor-color']).toBeUndefined();
      expect(config['selection-background']).toBeUndefined();
    });

    it('should convert palette to config entries', () => {
      const theme = {
        name: 'Theme With Palette',
        colors: {
          background: '#000000',
          foreground: '#ffffff',
          palette: [
            '#000000', '#ff0000', '#00ff00', '#0000ff',
            '#ffff00', '#ff00ff', '#00ffff', '#ffffff',
            '#808080', '#c0c0c0', '#404040', '#a0a0a0',
            '#202020', '#606060', '#e0e0e0', '#ffffff',
          ],
          raw: '',
        },
        raw: '',
      };

      const config = themeToConfig(theme);

      expect(config['palette']).toContain('0=#000000');
      expect(config['palette']).toContain('1=#ff0000');
      expect(config['palette']).toContain('15=#ffffff');
    });

    it('should filter out empty palette entries', () => {
      const theme = {
        name: 'Partial Palette',
        colors: {
          background: '#000000',
          foreground: '#ffffff',
          palette: ['', '', '#ff0000', '', '', '', '', '', '', '', '', '', '', '', '', ''],
          raw: '',
        },
        raw: '',
      };

      const config = themeToConfig(theme);

      expect(config['palette']).toEqual(['2=#ff0000']);
    });
  });

  describe('categorizeTheme', () => {
    it('should categorize dark theme (low luminance)', () => {
      const theme = {
        name: 'Dark Theme',
        colors: {
          background: '#1a1b26',
          foreground: '#c0caf5',
          palette: [],
          raw: '',
        },
        raw: '',
      };

      expect(categorizeTheme(theme)).toBe('dark');
    });

    it('should categorize light theme (high luminance)', () => {
      const theme = {
        name: 'Light Theme',
        colors: {
          background: '#ffffff',
          foreground: '#000000',
          palette: [],
          raw: '',
        },
        raw: '',
      };

      expect(categorizeTheme(theme)).toBe('light');
    });

    it('should handle mid-tone backgrounds', () => {
      // Background with ~50% luminance should be light
      const theme = {
        name: 'Mid Theme',
        colors: {
          background: '#808080', // 50% luminance
          foreground: '#000000',
          palette: [],
          raw: '',
        },
        raw: '',
      };

      // 0.299*128 + 0.587*128 + 0.114*128 = 128 which is exactly 0.5
      // The function returns "light" for > 0.5, so 0.5 exactly is light
      expect(categorizeTheme(theme)).toBe('light');
    });
  });

  describe('FEATURED_THEMES', () => {
    it('should contain expected popular themes', () => {
      expect(FEATURED_THEMES).toContain('Dracula');
      expect(FEATURED_THEMES).toContain('Tokyo Night');
      expect(FEATURED_THEMES).toContain('Nord');
    });

    it('should not have duplicates', () => {
      const unique = new Set(FEATURED_THEMES);
      expect(unique.size).toBe(FEATURED_THEMES.length);
    });

    it('should be an array with at least 10 themes', () => {
      expect(FEATURED_THEMES.length).toBeGreaterThanOrEqual(10);
    });
  });
});
