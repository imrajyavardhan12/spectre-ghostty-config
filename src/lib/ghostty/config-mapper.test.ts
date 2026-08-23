import { describe, expect, it } from 'vitest';
import {
  mapConfigToTerminalOptions,
  mapConfigToTheme,
} from '@/lib/ghostty/config-mapper';

describe('config mapper', () => {
  describe('mapConfigToTerminalOptions', () => {
    it('uses a scalar font-family value unchanged', () => {
      const options = mapConfigToTerminalOptions({
        'font-family': 'JetBrains Mono',
      });

      expect(options.fontFamily).toBe('JetBrains Mono');
    });

    it('maps repeatable font-family values to a browser CSS fallback stack', () => {
      const options = mapConfigToTerminalOptions({
        'font-family': ['JetBrains Mono', 'Symbols Nerd Font'],
      });

      expect(options.fontFamily).toBe('"JetBrains Mono", "Symbols Nerd Font", monospace');
    });

    it('falls back to monospace when font-family is empty', () => {
      const options = mapConfigToTerminalOptions({
        'font-family': ['', '   '],
      });

      expect(options.fontFamily).toBe('monospace');
    });

    it('maps font size and the supported cursor behavior', () => {
      const options = mapConfigToTerminalOptions({
        'font-size': 15.5,
        'cursor-style': 'block_hollow',
        'cursor-style-blink': true,
      });

      expect(options.fontSize).toBe(15.5);
      expect(options.cursorStyle).toBe('block');
      expect(options.cursorBlink).toBe(true);
    });

    it('disables cursor blinking for values other than true', () => {
      const options = mapConfigToTerminalOptions({
        'cursor-style-blink': false,
      });

      expect(options.cursorBlink).toBe(false);
    });
  });

  describe('mapConfigToTheme', () => {
    it('maps foreground, background, cursor, and selection colors', () => {
      const theme = mapConfigToTheme({
        background: '#101010',
        foreground: '#f0f0f0',
        'cursor-color': '#ff0000',
        'cursor-text': '#00ff00',
        'selection-background': '#0000ff',
        'selection-foreground': '#ffffff',
      });

      expect(theme).toMatchObject({
        background: '#101010',
        foreground: '#f0f0f0',
        cursor: '#ff0000',
        cursorAccent: '#00ff00',
        selectionBackground: '#0000ff',
        selectionForeground: '#ffffff',
      });
    });

    it('maps Ghostty indexed palette entries to terminal ANSI theme colors', () => {
      const theme = mapConfigToTheme({
        palette: [
          '0=#000000',
          '1=#ff0000',
          '2=00ff00',
          '0xF=#ffffff',
        ],
      });

      expect(theme.black).toBe('#000000');
      expect(theme.red).toBe('#ff0000');
      expect(theme.green).toBe('#00ff00');
      expect(theme.brightWhite).toBe('#ffffff');
    });

    it('maps legacy positional raw palette colors for backwards compatibility', () => {
      const theme = mapConfigToTheme({
        palette: ['#000000', '#ff0000'],
      });

      expect(theme.black).toBe('#000000');
      expect(theme.red).toBe('#ff0000');
    });
  });
});
