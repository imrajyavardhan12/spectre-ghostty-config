import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import compatibility from '../../compatibility.json';
import packageJson from '../../package.json';
import { allOptions } from '@/data/ghostty-options';
import {
  GHOSTTY_COMPATIBILITY_VERSION,
  GHOSTTY_PREVIEW_ENGINE,
  GHOSTTY_PUBLIC_OPTION_COUNT,
  SPECTRE_RELEASE_LINE,
} from '@/lib/compatibility';

describe('compatibility manifest', () => {
  it('matches the current Spectre release line and local schema', () => {
    const [major, minor] = packageJson.version.split('.');

    expect(compatibility.spectreReleaseLine).toBe(`${major}.${minor}.x`);
    expect(SPECTRE_RELEASE_LINE).toBe(compatibility.spectreReleaseLine);
    expect(GHOSTTY_COMPATIBILITY_VERSION).toBe(
      compatibility.ghostty.stableVersion
    );
    expect(GHOSTTY_PUBLIC_OPTION_COUNT).toBe(
      compatibility.ghostty.publicOptionCount
    );
    expect(allOptions).toHaveLength(compatibility.ghostty.publicOptionCount);
  });

  it('keeps the public compatibility policy aligned with the manifest', () => {
    const policy = readFileSync(
      resolve(process.cwd(), 'COMPATIBILITY.md'),
      'utf8'
    );
    const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');

    expect(policy).toContain(`| \`${compatibility.spectreReleaseLine}\` |`);
    expect(policy).toContain(
      `/release-notes/${compatibility.ghostty.stableVersion.replaceAll('.', '-')}`
    );
    expect(policy).toContain(`| ${compatibility.ghostty.publicOptionCount} |`);
    expect(policy).toContain(compatibility.ghostty.verifiedOn);
    expect(policy).toContain(`ghostty-web@${compatibility.preview.version}`);
    expect(policy).toContain(compatibility.preview.sourceTag);
    expect(policy).toContain(compatibility.preview.ghosttySourceCommit);
    expect(readme).toContain(
      `Spectre \`${compatibility.spectreReleaseLine}\` currently targets [Ghostty ${compatibility.ghostty.stableVersion}]`
    );
    expect(readme).toContain(
      `All ${compatibility.ghostty.publicOptionCount} public configuration option IDs`
    );
    expect(readme).toContain('[compatibility policy](COMPATIBILITY.md)');
  });

  it('records patch-level availability introduced by the stable target', () => {
    expect(
      allOptions.find((option) => option.id === 'progress-style')?.sinceVersion
    ).toBe('1.3.1');
  });

  it('identifies an immutable Ghostty stable source snapshot', () => {
    expect(compatibility.ghostty.tag).toBe(
      `v${compatibility.ghostty.stableVersion}`
    );
    expect(compatibility.ghostty.configCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(Number.isNaN(Date.parse(compatibility.ghostty.verifiedOn))).toBe(false);
  });

  it('matches the installed preview package contract', () => {
    const dependencies = packageJson.dependencies as Record<string, string>;
    const lockfile = readFileSync(
      resolve(process.cwd(), 'bun.lock'),
      'utf8'
    );

    expect(dependencies[compatibility.preview.package]).toContain(
      compatibility.preview.version
    );
    expect(lockfile).toContain(
      `"${compatibility.preview.package}": ["${compatibility.preview.package}@${compatibility.preview.version}"`
    );
    expect(GHOSTTY_PREVIEW_ENGINE).toEqual(compatibility.preview);
    expect(compatibility.preview.sourceTag).toBe(
      `v${compatibility.preview.version}`
    );
    expect(compatibility.preview.ghosttySourceCommit).toMatch(/^[0-9a-f]{40}$/);
  });
});
