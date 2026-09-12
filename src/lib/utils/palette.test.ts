import { describe, expect, it } from 'vitest';
import {
  getPaletteColor,
  normalizePaletteEntries,
  parsePaletteEntry,
  parsePaletteEntryDetailed,
  setPaletteColor,
} from '@/lib/utils/palette';

describe('palette utilities', () => {
  describe('parsePaletteEntry', () => {
    it('parses decimal Ghostty palette entries and normalizes hex colors', () => {
      expect(parsePaletteEntry('5=BB78D9')).toEqual({ index: 5, color: '#BB78D9' });
      expect(parsePaletteEntry('5=#BB78D9')).toEqual({ index: 5, color: '#BB78D9' });
    });

    it('parses signed and separated Ghostty palette indexes across supported bases', () => {
      expect(parsePaletteEntry('+1=#010101')).toEqual({ index: 1, color: '#010101' });
      expect(parsePaletteEntry('-0=#000000')).toEqual({ index: 0, color: '#000000' });
      expect(parsePaletteEntry('1_0=#101010')).toEqual({ index: 10, color: '#101010' });
      expect(parsePaletteEntry('0b1_01=#111111')).toEqual({ index: 5, color: '#111111' });
      expect(parsePaletteEntry('0o1_0=#222222')).toEqual({ index: 8, color: '#222222' });
      expect(parsePaletteEntry('0xF=#333333')).toEqual({ index: 15, color: '#333333' });
    });

    it('distinguishes malformed source-file palette fields', () => {
      expect(parsePaletteEntryDetailed('#ffffff')).toEqual({
        status: 'missing-separator',
      });
      expect(parsePaletteEntryDetailed('nope=#ffffff')).toEqual({
        status: 'invalid-index',
      });
      expect(parsePaletteEntryDetailed('256=#ffffff')).toEqual({
        status: 'invalid-index',
      });
      expect(parsePaletteEntryDetailed('15=')).toEqual({
        status: 'empty-color',
      });
    });

    it('returns null for invalid or out-of-range entries', () => {
      expect(parsePaletteEntry('#ffffff')).toBeNull();
      expect(parsePaletteEntry('not-an-index=#ffffff')).toBeNull();
      expect(parsePaletteEntry('256=#ffffff')).toBeNull();
      expect(parsePaletteEntry('15=')).toBeNull();
    });

    it('preserves named colors supported by Ghostty/X11 syntax', () => {
      expect(parsePaletteEntry('1=red')).toEqual({ index: 1, color: 'red' });
    });
  });

  describe('normalizePaletteEntries', () => {
    it('keeps Ghostty entries normalized and converts legacy positional colors', () => {
      expect(normalizePaletteEntries(['#000000', 'ff0000', '2=#00ff00', '0xF=ffffff'])).toEqual([
        '0=#000000',
        '1=#ff0000',
        '2=#00ff00',
        '15=#ffffff',
      ]);
    });

    it('drops empty entries while preserving invalid unknown entries for user correction', () => {
      expect(normalizePaletteEntries(['', 'not a color'])).toEqual(['1=not a color']);
    });
  });

  describe('getPaletteColor', () => {
    it('reads colors by palette index and lets later duplicate entries win', () => {
      expect(getPaletteColor(['0=#000000', '1=#111111', '1=#222222'], 1)).toBe('#222222');
    });

    it('returns undefined for missing indexes', () => {
      expect(getPaletteColor(['0=#000000'], 2)).toBeUndefined();
    });
  });

  describe('setPaletteColor', () => {
    it('stores edited colors as Ghostty index=color entries', () => {
      expect(setPaletteColor([], 3, '#abcdef')).toEqual(['3=#abcdef']);
    });

    it('updates an existing entry while preserving unrelated entries', () => {
      expect(setPaletteColor(['0=#000000', '1=#111111', '16=#eeeeee'], 1, '222222')).toEqual([
        '0=#000000',
        '1=#222222',
        '16=#eeeeee',
      ]);
    });

    it('removes an entry when color is blank', () => {
      expect(setPaletteColor(['0=#000000', '1=#111111'], 1, '')).toEqual(['0=#000000']);
    });
  });
});
