import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';
import { SPECTRE_VERSION } from '@/lib/version';

describe('Spectre product version', () => {
  it('matches package.json', () => {
    expect(SPECTRE_VERSION).toBe(packageJson.version);
  });
});
