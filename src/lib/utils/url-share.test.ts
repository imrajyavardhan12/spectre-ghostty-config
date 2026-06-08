import { describe, it, expect } from 'vitest';
import LZString from 'lz-string';
import {
  encodeConfig,
  decodeConfig,
  generateShareUrl,
  getConfigFromUrl,
} from '@/lib/utils/url-share';

function encodeRawJson(json: string): string {
  return LZString.compressToEncodedURIComponent(json);
}

describe('url-share', () => {
  describe('encodeConfig', () => {
    it('should encode empty config', () => {
      const encoded = encodeConfig({});
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should encode config with values', () => {
      const config = {
        'font-size': 16,
        'font-family': 'JetBrains Mono',
      };
      const encoded = encodeConfig(config);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should include theme name when provided', () => {
      const config = { 'font-size': 16 };
      const encoded = encodeConfig(config, 'Tokyo Night');
      const decoded = decodeConfig(encoded);
      expect(decoded?.theme).toBe('Tokyo Night');
    });

    it('should normalise a null theme to null on decode', () => {
      const config = { 'font-size': 16 };
      const encoded = encodeConfig(config, null);
      const decoded = decodeConfig(encoded);
      // The decoder normalises "no theme" to a stable null shape; this
      // is what the share page and the config store expect.
      expect(decoded?.theme).toBeNull();
    });
  });

  describe('decodeConfig', () => {
    it('should decode valid encoded config', () => {
      const config = {
        'font-size': 16,
        'font-family': 'JetBrains Mono',
      };
      const encoded = encodeConfig(config);
      const decoded = decodeConfig(encoded);

      expect(decoded).toBeTruthy();
      expect(decoded?.config['font-size']).toBe(16);
      expect(decoded?.config['font-family']).toBe('JetBrains Mono');
    });

    it('should return null for invalid input', () => {
      expect(decodeConfig('not-valid-base64!@#$')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(decodeConfig('')).toBeNull();
    });

    it('should handle arrays in config', () => {
      const config = {
        keybind: ['ctrl+c=copy', 'ctrl+v=paste'],
      };
      const encoded = encodeConfig(config);
      const decoded = decodeConfig(encoded);

      expect(decoded?.config['keybind']).toEqual(['ctrl+c=copy', 'ctrl+v=paste']);
    });

    it('should preserve theme name', () => {
      const config = { 'font-size': 14 };
      const encoded = encodeConfig(config, 'Dracula');
      const decoded = decodeConfig(encoded);

      expect(decoded?.theme).toBe('Dracula');
    });
  });

  describe('generateShareUrl', () => {
    it('should generate URL with encoded config', () => {
      const config = { 'font-size': 16 };
      const url = generateShareUrl(config);

      expect(url).toContain('/share?c=');
      expect(url).toContain('http');
    });

    it('should include theme in URL when provided', () => {
      const config = { 'font-size': 16 };
      const url = generateShareUrl(config, 'Nord');

      const decoded = decodeConfig(url.split('c=')[1]);
      expect(decoded?.theme).toBe('Nord');
    });
  });

  describe('getConfigFromUrl', () => {
    it('should extract config from URLSearchParams', () => {
      const config = { 'font-size': 20 };
      const encoded = encodeConfig(config);
      const searchParams = new URLSearchParams(`c=${encoded}`);
      const result = getConfigFromUrl(searchParams);

      expect(result).toBeTruthy();
      expect(result?.config['font-size']).toBe(20);
    });

    it('should return null when no c param', () => {
      const searchParams = new URLSearchParams();
      const result = getConfigFromUrl(searchParams);

      expect(result).toBeNull();
    });

    it('should return null for invalid c param', () => {
      const searchParams = new URLSearchParams('c=invalid!!!');
      const result = getConfigFromUrl(searchParams);

      expect(result).toBeNull();
    });
  });

  describe('roundtrip', () => {
    it('should preserve complex config through encode/decode', () => {
      const original = {
        'font-size': 14,
        'font-family': 'Fira Code',
        'cursor-style': 'bar',
        'background-opacity': 0.95,
        keybind: ['ctrl+c=copy', 'ctrl+v=paste'],
      };

      const encoded = encodeConfig(original);
      const decoded = decodeConfig(encoded);

      expect(decoded?.config['font-size']).toBe(14);
      expect(decoded?.config['font-family']).toBe('Fira Code');
      expect(decoded?.config['cursor-style']).toBe('bar');
      expect(decoded?.config['background-opacity']).toBe(0.95);
      expect(decoded?.config['keybind']).toEqual(['ctrl+c=copy', 'ctrl+v=paste']);
    });
  });

  describe('security hardening', () => {
    it('drops unknown option keys', () => {
      const malicious = encodeConfig({
        'font-size': 14,
        'backdoor-cmd': 'rm -rf /',
      });
      const decoded = decodeConfig(malicious);
      expect(decoded?.config['font-size']).toBe(14);
      expect(decoded?.config['backdoor-cmd']).toBeUndefined();
    });

    it('coerces non-primitive values into the expected shape', () => {
      // Construct a payload that bypasses TypeScript and embeds a
      // non-primitive value. The decoder must drop it.
      const rawJson =
        '{"config":{"font-size":{"__html":"<img onerror=alert(1) src=x>"}},"version":1}';
      const compressed = encodeRawJson(rawJson);
      const decoded = decodeConfig(compressed);
      // The unknown shape is rejected, so the key is dropped.
      expect(decoded?.config['font-size']).toBeUndefined();
    });

    it('rejects prototype-pollution key names', () => {
      const rawJson = '{"config":{"__proto__":{"polluted":true}},"version":1}';
      const compressed = encodeRawJson(rawJson);
      const decoded = decodeConfig(compressed);
      // The decoder does not copy __proto__ into the result.
      expect((decoded?.config as Record<string, unknown>)['__proto__']).toBeUndefined();
      // And nothing got attached to Object.prototype.
      expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
    });

    it('rejects enum values not in the allowed list', () => {
      const rawJson = '{"config":{"cursor-style":"rainbow"},"version":1}';
      const compressed = encodeRawJson(rawJson);
      const decoded = decodeConfig(compressed);
      expect(decoded?.config['cursor-style']).toBeUndefined();
    });

    it('rejects malformed palette entries', () => {
      const rawJson =
        '{"config":{"palette":["<script>alert(1)</script>"]},"version":1}';
      const compressed = encodeRawJson(rawJson);
      const decoded = decodeConfig(compressed);
      expect(decoded?.config['palette']).toBeUndefined();
    });

    it('rejects a theme name that breaks out of a comment', () => {
      const rawJson = '{"config":{},"theme":"evil\\nname","version":1}';
      const compressed = encodeRawJson(rawJson);
      const decoded = decodeConfig(compressed);
      expect(decoded?.theme).toBeNull();
    });

    it('returns a config with a null prototype', () => {
      const decoded = decodeConfig(encodeConfig({ 'font-size': 14 }));
      expect(Object.getPrototypeOf(decoded!.config)).toBeNull();
    });

    it('still returns null for outright garbage', () => {
      expect(decodeConfig('not-valid-base64!@#$')).toBeNull();
      expect(decodeConfig('')).toBeNull();
    });
  });
});
