import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseThemeContent,
  themeToConfig,
  categorizeTheme,
  FEATURED_THEMES,
  ensureTextResponse,
  readBoundedText,
  fetchThemeList,
  fetchTheme,
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
palette = 0=#000000
palette = 1=#ff0000
palette = 15=#ffffff
`;
      const colors = parseThemeContent(content);

      expect(colors.palette[0]).toBe('#000000');
      expect(colors.palette[1]).toBe('#ff0000');
      expect(colors.palette[15]).toBe('#ffffff');
    });
  });

  describe('themeToConfig', () => {
    it('should convert theme colors to config format', () => {
      const theme = {
        name: 'Test',
        raw: '',
        colors: {
          background: '#000000',
          foreground: '#ffffff',
          cursorColor: '#ff0000',
          palette: ['#111111', '#222222', '', '', '', '', '', '',
            '', '', '', '', '', '', '', ''],
        },
      };

      const config = themeToConfig(theme);
      expect(config.background).toBe('#000000');
      expect(config.foreground).toBe('#ffffff');
      expect(config['cursor-color']).toBe('#ff0000');
      expect(config.palette).toEqual(['0=#111111', '1=#222222']);
    });

    it('should omit palette when no colors are set', () => {
      const theme = {
        name: 'Empty',
        raw: '',
        colors: {
          background: '#000000',
          foreground: '#ffffff',
          palette: Array(16).fill(''),
        },
      };

      const config = themeToConfig(theme);
      expect(config.palette).toBeUndefined();
    });
  });

  describe('categorizeTheme', () => {
    it('should categorize dark themes', () => {
      const dark = {
        name: 'Dark',
        raw: '',
        colors: { background: '#000000', foreground: '#ffffff', palette: [] },
      };
      expect(categorizeTheme(dark)).toBe('dark');
    });

    it('should categorize light themes', () => {
      const light = {
        name: 'Light',
        raw: '',
        colors: { background: '#ffffff', foreground: '#000000', palette: [] },
      };
      expect(categorizeTheme(light)).toBe('light');
    });
  });

  describe('FEATURED_THEMES', () => {
    it('should be a non-empty array of strings', () => {
      expect(Array.isArray(FEATURED_THEMES)).toBe(true);
      expect(FEATURED_THEMES.length).toBeGreaterThan(0);
      FEATURED_THEMES.forEach((name) => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('theme fetch hardening', () => {
  describe('ensureTextResponse', () => {
    it('accepts a response whose content-type starts with the expected prefix', () => {
      const response = new Response('hello', {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
      expect(() => ensureTextResponse(response, 'text/', 'test')).not.toThrow();
    });

    it('is case-insensitive on the content-type', () => {
      const response = new Response('hello', {
        headers: { 'content-type': 'Text/Plain' },
      });
      expect(() => ensureTextResponse(response, 'text/', 'test')).not.toThrow();
    });

    it('throws when the content-type does not match', () => {
      const response = new Response('hello', {
        headers: { 'content-type': 'application/octet-stream' },
      });
      expect(() => ensureTextResponse(response, 'text/', 'theme "X"'))
        .toThrow(/Unexpected content-type/);
    });

    it('throws when the content-type header is missing', () => {
      // The Response constructor auto-adds `content-type: text/plain`
      // for string bodies, so we delete it explicitly to exercise the
      // missing-header fallback in the production code.
      const response = new Response('hello');
      response.headers.delete('content-type');
      expect(() => ensureTextResponse(response, 'text/', 'theme "X"'))
        .toThrow(/Unexpected content-type/);
    });
  });

  describe('readBoundedText', () => {
    it('reads a small text body correctly', async () => {
      const response = new Response('hello world', {
        headers: { 'content-type': 'text/plain' },
      });
      const text = await readBoundedText(response, 'test');
      expect(text).toBe('hello world');
    });

    it('throws when the body exceeds the 256 KB cap', async () => {
      // Build a 300 KB body across multiple chunks so the streaming
      // reader's per-chuck accounting is exercised, not just a single
      // massive buffer.
      const big = new Uint8Array(300 * 1024).fill(0x41); // 300 KB of 'A'
      const stream = new ReadableStream({
        start(controller) {
          // Split into 16 chunks of ~18 KB so the read loop runs many
          // iterations.
          const chunkSize = 18 * 1024;
          for (let offset = 0; offset < big.byteLength; offset += chunkSize) {
            controller.enqueue(big.slice(offset, offset + chunkSize));
          }
          controller.close();
        },
      });
      const response = new Response(stream, {
        headers: { 'content-type': 'text/plain' },
      });

      await expect(readBoundedText(response, 'test'))
        .rejects.toThrow(/exceeded 262144 bytes/);
    });

    it('falls back to response.text() when the body stream is unavailable', async () => {
      // A Response constructed from a string is fine, but a Response
      // with `body: null` only happens for certain edge cases (e.g.
      // a no-content status). We construct it explicitly to make sure
      // the fallback path also reads the body correctly.
      const response = new Response(null, { status: 204 });
      const text = await readBoundedText(response, 'test');
      expect(text).toBe('');
    });
  });

  describe('fetchThemeList', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(globalThis, 'fetch');
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('returns the file entries when the GitHub API responds with an array', async () => {
      fetchSpy.mockResolvedValue(
        new Response(
          JSON.stringify([
            { type: 'file', name: 'Dracula', download_url: 'https://example/dracula' },
            { type: 'dir', name: 'subfolder', download_url: '' },
            { type: 'file', name: 'Nord', download_url: 'https://example/nord' },
          ]),
          { headers: { 'content-type': 'application/json' } }
        )
      );

      const list = await fetchThemeList();
      expect(list).toEqual([
        { name: 'Dracula', downloadUrl: 'https://example/dracula' },
        { name: 'Nord', downloadUrl: 'https://example/nord' },
      ]);
    });

    it('accepts a valid GitHub API list larger than the individual theme-file cap', async () => {
      const entries = Array.from({ length: 3000 }, (_, index) => ({
        type: 'file',
        name: `Theme ${index.toString().padStart(4, '0')}`,
        download_url: `https://example.test/theme-${index.toString().padStart(4, '0')}`,
        path: `ghostty/theme-${index.toString().padStart(4, '0')}`,
        sha: 'a'.repeat(40),
      }));
      const payload = JSON.stringify(entries);
      expect(new TextEncoder().encode(payload).byteLength).toBeGreaterThan(256 * 1024);

      fetchSpy.mockResolvedValue(
        new Response(payload, { headers: { 'content-type': 'application/json' } })
      );

      const list = await fetchThemeList();
      expect(list).toHaveLength(3000);
      expect(list[0]).toEqual({
        name: 'Theme 0000',
        downloadUrl: 'https://example.test/theme-0000',
      });
    });

    it('rejects when the JSON content-type is wrong', async () => {
      fetchSpy.mockResolvedValue(
        new Response('not json', { headers: { 'content-type': 'text/html' } })
      );

      await expect(fetchThemeList()).rejects.toThrow(/Unexpected content-type/);
    });

    it('rejects when the body is valid JSON but not an array', async () => {
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify({ message: 'rate limited' }), {
          headers: { 'content-type': 'application/json' },
        })
      );

      await expect(fetchThemeList()).rejects.toThrow(
        /Unexpected theme list response shape/
      );
    });
  });

  describe('fetchTheme', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(globalThis, 'fetch');
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('returns a parsed theme for a valid response', async () => {
      const theme = 'background = #1a1b26\nforeground = #c0caf5\n';
      fetchSpy.mockResolvedValue(
        new Response(theme, { headers: { 'content-type': 'text/plain' } })
      );

      const result = await fetchTheme('Tokyo Night');
      expect(result.colors.background).toBe('#1a1b26');
      expect(result.colors.foreground).toBe('#c0caf5');
      expect(result.raw).toBe(theme);
    });

    it('rejects when the content-type is not text', async () => {
      fetchSpy.mockResolvedValue(
        new Response('background = #000', {
          headers: { 'content-type': 'application/octet-stream' },
        })
      );

      await expect(fetchTheme('Whatever')).rejects.toThrow(/Unexpected content-type/);
    });

    it('rejects a theme body larger than the 256 KB cap', async () => {
      const huge = '# ' + 'a'.repeat(300 * 1024) + '\n';
      const stream = new ReadableStream({
        start(controller) {
          const chunkSize = 32 * 1024;
          const bytes = new TextEncoder().encode(huge);
          for (let offset = 0; offset < bytes.byteLength; offset += chunkSize) {
            controller.enqueue(bytes.slice(offset, offset + chunkSize));
          }
          controller.close();
        },
      });
      fetchSpy.mockResolvedValue(
        new Response(stream, { headers: { 'content-type': 'text/plain' } })
      );

      await expect(fetchTheme('Huge')).rejects.toThrow(/exceeded 262144 bytes/);
    });
  });
});
