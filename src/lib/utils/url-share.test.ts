import { describe, it, expect } from 'vitest';
import {
  encodeConfig,
  decodeConfig,
  generateShareUrl,
  getConfigFromUrl,
} from '@/lib/utils/url-share';

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

    it('should not include theme when null', () => {
      const config = { 'font-size': 16 };
      const encoded = encodeConfig(config, null);
      const decoded = decodeConfig(encoded);
      expect(decoded?.theme).toBeUndefined();
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
});
