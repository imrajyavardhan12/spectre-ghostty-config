import { describe, expect, it } from 'vitest';
import { parseGhosttyConfig } from '@/lib/utils/config-import';

describe('parseGhosttyConfig', () => {
  it('parses Ghostty config syntax without depending on the Zustand store', () => {
    const config = parseGhosttyConfig(`
# Comments are skipped
font-family = JetBrains Mono
font-family = Symbols Nerd Font
keybind = ctrl+shift+e=text:FOO=bar
keybind = clear
palette = 0b10=red
unknown-option = "raw = value"
`);

    expect(config['font-family']).toEqual([
      'JetBrains Mono',
      'Symbols Nerd Font',
    ]);
    expect(config.keybind).toEqual([
      'ctrl+shift+e=text:FOO=bar',
      'clear',
    ]);
    expect(config.palette).toEqual(['0b10=red']);
    expect(config['unknown-option']).toBe('raw = value');
  });

  it('preserves Ghostty path optional marker semantics', () => {
    const config = parseGhosttyConfig(`
config-file = first
config-file = ""
config-file = second
config-file =
config-file = after-reset
gtk-custom-css = "?required.css"
gtk-custom-css = ?optional.css
custom-shader = first.glsl
custom-shader = ""
custom-shader = second.glsl
`);

    expect(config['config-file']).toBe('after-reset');
    expect(config['gtk-custom-css']).toEqual([
      '"?required.css"',
      '?optional.css',
    ]);
    expect(config['custom-shader']).toEqual([
      'first.glsl',
      'second.glsl',
    ]);
  });
});
