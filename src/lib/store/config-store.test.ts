import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useConfigStore } from '@/lib/store/config-store';
import { GHOSTTY_COMPATIBILITY_VERSION } from '@/lib/compatibility';
import { SPECTRE_VERSION } from '@/lib/version';
import { act } from '@testing-library/react';

// Helper to run hooks inside a test
function getStoreState() {
  return useConfigStore.getState();
}

describe('config-store', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  afterEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  describe('setValue', () => {
    it('should set a string value', () => {
      act(() => {
        useConfigStore.getState().setValue('font-family', 'JetBrains Mono');
      });

      const state = getStoreState();
      expect(state.config['font-family']).toBe('JetBrains Mono');
    });

    it('should set a number value', () => {
      act(() => {
        useConfigStore.getState().setValue('font-size', 16);
      });

      const state = getStoreState();
      expect(state.config['font-size']).toBe(16);
    });

    it('should set a boolean value', () => {
      act(() => {
        useConfigStore.getState().setValue('cursor-style-blink', true);
      });

      const state = getStoreState();
      expect(state.config['cursor-style-blink']).toBe(true);
    });

    it('should remove value if set to default', () => {
      // font-size default is 13
      act(() => {
        useConfigStore.getState().setValue('font-size', 13);
      });

      const state = getStoreState();
      expect(state.config['font-size']).toBeUndefined();
    });

    it('should normalize legacy positional palette values', () => {
      act(() => {
        useConfigStore.getState().setValue('palette', ['#000000', '#ff0000']);
      });

      const state = getStoreState();
      expect(state.config['palette']).toEqual(['0=#000000', '1=#ff0000']);
    });

    it('should remove array values if set to an empty default array', () => {
      act(() => {
        useConfigStore.getState().setValue('keybind', ['ctrl+shift+t=new_tab']);
        useConfigStore.getState().setValue('keybind', []);
      });

      const state = getStoreState();
      expect(state.config['keybind']).toBeUndefined();
    });

    it('should clear applied theme when a theme color value changes', () => {
      act(() => {
        useConfigStore.getState().loadConfig({ background: '#000000' }, 'Dracula');
        useConfigStore.getState().setValue('foreground', '#ffffff');
      });

      const state = getStoreState();
      expect(state.appliedTheme).toBeNull();
      expect(state.config.foreground).toBe('#ffffff');
    });

    it('should keep applied theme when a non-theme value changes', () => {
      act(() => {
        useConfigStore.getState().loadConfig({ background: '#000000' }, 'Dracula');
        useConfigStore.getState().setValue('font-size', 16);
      });

      const state = getStoreState();
      expect(state.appliedTheme).toBe('Dracula');
      expect(state.config['font-size']).toBe(16);
    });
  });

  describe('resetValue', () => {
    it('should remove a value from config', () => {
      act(() => {
        useConfigStore.getState().setValue('font-size', 16);
      });

      act(() => {
        useConfigStore.getState().resetValue('font-size');
      });

      const state = getStoreState();
      expect(state.config['font-size']).toBeUndefined();
    });
  });

  describe('resetAll', () => {
    it('should clear all config values', () => {
      act(() => {
        useConfigStore.getState().setValue('font-size', 16);
        useConfigStore.getState().setValue('font-family', 'JetBrains Mono');
      });

      act(() => {
        useConfigStore.getState().resetAll();
      });

      const state = getStoreState();
      expect(state.config).toEqual({});
    });
  });

  describe('getValue', () => {
    it('should return custom value if set', () => {
      act(() => {
        useConfigStore.getState().setValue('font-size', 16);
      });

      const value = useConfigStore.getState().getValue('font-size');
      expect(value).toBe(16);
    });

    it('should return default value if not set', () => {
      const value = useConfigStore.getState().getValue('font-size');
      expect(value).toBe(13); // default
    });
  });

  describe('isModified', () => {
    it('should return true if value is modified', () => {
      act(() => {
        useConfigStore.getState().setValue('font-size', 16);
      });

      const modified = useConfigStore.getState().isModified('font-size');
      expect(modified).toBe(true);
    });

    it('should return false if value is default', () => {
      const modified = useConfigStore.getState().isModified('font-size');
      expect(modified).toBe(false);
    });
  });

  describe('importConfig', () => {
    it('should clear applied theme when importing a config string', () => {
      act(() => {
        useConfigStore.getState().loadConfig({ background: '#000000' }, 'Dracula');
        useConfigStore.getState().importConfig('font-size = 16');
      });

      const state = getStoreState();
      expect(state.appliedTheme).toBeNull();
      expect(state.config['font-size']).toBe(16);
    });

    it('should parse a simple config string', () => {
      const configString = `
font-size = 16
font-family = "JetBrains Mono"
cursor-style-blink = true
`;

      act(() => {
        useConfigStore.getState().importConfig(configString);
      });

      const state = getStoreState();
      expect(state.config['font-size']).toBe(16);
      expect(state.config['font-family']).toBe('JetBrains Mono');
      expect(state.config['cursor-style-blink']).toBe('true'); // enum type stores as string
    });

    it('should handle keybind values', () => {
      const configString = `
keybind = ctrl+shift+c=copy_to_clipboard
keybind = ctrl+shift+v=paste_from_clipboard
keybind = ctrl+shift+e=text:FOO=bar
keybind = clear
`;

      act(() => {
        useConfigStore.getState().importConfig(configString);
      });

      const state = getStoreState();
      expect(state.config['keybind']).toEqual([
        'ctrl+shift+c=copy_to_clipboard',
        'ctrl+shift+v=paste_from_clipboard',
        'ctrl+shift+e=text:FOO=bar',
        'clear',
      ]);

      const output = useConfigStore.getState().exportConfig();
      expect(output).toContain('keybind = ctrl+shift+e=text:FOO=bar');
      expect(output).toContain('keybind = clear');
    });

    it('should round-trip quoted strings with spaces and equals signs', () => {
      const configString = `
title = "Spectre = Ghostty Config"
command = "zsh -lc echo=hello"
unknown-option = "raw = value with spaces"
`;

      act(() => {
        useConfigStore.getState().importConfig(configString);
      });

      const state = getStoreState();
      expect(state.config['title']).toBe('Spectre = Ghostty Config');
      expect(state.config['command']).toBe('zsh -lc echo=hello');
      expect(state.config['unknown-option']).toBe('raw = value with spaces');

      const output = useConfigStore.getState().exportConfig();
      expect(output).toContain('title = "Spectre = Ghostty Config"');
      expect(output).toContain('command = "zsh -lc echo=hello"');
      expect(output).toContain('unknown-option = "raw = value with spaces"');
    });

    it('should round-trip repeatable string options', () => {
      const configString = `
font-family = JetBrains Mono
font-family = Symbols Nerd Font
env = PATH=/usr/local/bin
env = EDITOR=nvim
config-file = ?local
config-file = /etc/ghostty/config
custom-shader = shaders/crt.glsl
custom-shader = shaders/glow.glsl
gtk-custom-css = gtk/base.css
gtk-custom-css = gtk/overrides.css
`;

      act(() => {
        useConfigStore.getState().importConfig(configString);
      });

      const state = getStoreState();
      expect(state.config['font-family']).toEqual([
        'JetBrains Mono',
        'Symbols Nerd Font',
      ]);
      expect(state.config['env']).toEqual([
        'PATH=/usr/local/bin',
        'EDITOR=nvim',
      ]);
      expect(state.config['config-file']).toEqual([
        '?local',
        '/etc/ghostty/config',
      ]);
      expect(state.config['custom-shader']).toEqual([
        'shaders/crt.glsl',
        'shaders/glow.glsl',
      ]);
      expect(state.config['gtk-custom-css']).toEqual([
        'gtk/base.css',
        'gtk/overrides.css',
      ]);

      const output = useConfigStore.getState().exportConfig();
      expect(output).toContain('font-family = "JetBrains Mono"');
      expect(output).toContain('font-family = "Symbols Nerd Font"');
      expect(output).toContain('env = PATH=/usr/local/bin');
      expect(output).toContain('env = EDITOR=nvim');
      expect(output).toContain('config-file = ?local');
      expect(output).toContain('config-file = /etc/ghostty/config');
      expect(output).toContain('custom-shader = shaders/crt.glsl');
      expect(output).toContain('custom-shader = shaders/glow.glsl');
      expect(output).toContain('gtk-custom-css = gtk/base.css');
      expect(output).toContain('gtk-custom-css = gtk/overrides.css');
    });

    it('should preserve Ghostty path optional marker semantics', () => {
      const configString = `
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
custom-shader = reset
custom-shader = ignore
`;

      act(() => {
        useConfigStore.getState().importConfig(configString);
      });

      const state = getStoreState();
      expect(state.config['config-file']).toBe('after-reset');
      expect(state.config['gtk-custom-css']).toEqual([
        '"?required.css"',
        '?optional.css',
      ]);
      expect(state.config['custom-shader']).toEqual([
        'first.glsl',
        'second.glsl',
        'reset',
        'ignore',
      ]);

      const output = useConfigStore.getState().exportConfig();
      expect(output).not.toContain('config-file = first');
      expect(output).not.toContain('config-file = second');
      expect(output).toContain('config-file = after-reset');
      expect(output).toContain('gtk-custom-css = "?required.css"');
      expect(output).toContain('gtk-custom-css = ?optional.css');
      expect(output).toContain('custom-shader = first.glsl');
      expect(output).toContain('custom-shader = second.glsl');
      expect(output).toContain('custom-shader = reset');
      expect(output).toContain('custom-shader = ignore');
      expect(output).not.toContain('custom-shader = ""');
    });

    it('should handle indexed palette values', () => {
      const configString = `
palette = 0=#000000
palette = 1=ff0000
palette = 0b10=red
palette = 0o10=#111111
palette = 0xF=ffffff
`;

      act(() => {
        useConfigStore.getState().importConfig(configString);
      });

      const state = getStoreState();
      expect(state.config['palette']).toEqual([
        '0=#000000',
        '1=#ff0000',
        '2=red',
        '8=#111111',
        '15=#ffffff',
      ]);

      const output = useConfigStore.getState().exportConfig();
      expect(output).toContain('palette = 2=red');
      expect(output).toContain('palette = 8=#111111');
      expect(output).toContain('palette = 15=#ffffff');
    });

    it('should skip comments and empty lines', () => {
      const configString = `
# This is a comment
font-size = 16

# Another comment
`;

      act(() => {
        useConfigStore.getState().importConfig(configString);
      });

      const state = getStoreState();
      expect(state.config['font-size']).toBe(16);
    });

    it('should treat empty known values as resets to Ghostty defaults', () => {
      const configString = `
font-size = 18
font-size =
cursor-style = bar
cursor-style =
font-family = JetBrains Mono
font-family =
keybind = ctrl+shift+t=new_tab
keybind =
`;

      act(() => {
        useConfigStore.getState().importConfig(configString);
      });

      const state = getStoreState();
      expect(state.config).not.toHaveProperty('font-size');
      expect(state.config).not.toHaveProperty('cursor-style');
      expect(state.config).not.toHaveProperty('font-family');
      expect(state.config).not.toHaveProperty('keybind');

      const output = useConfigStore.getState().exportConfig();
      expect(output).not.toContain('font-size');
      expect(output).not.toContain('cursor-style');
      expect(output).not.toContain('font-family');
      expect(output).not.toContain('keybind');
    });

    it('should omit imported known values that match Ghostty defaults', () => {
      const configString = `
font-size = 13
desktop-notifications = true
cursor-style = block
font-synthetic-style = bold,italic,bold-italic
unknown-option = true
`;

      act(() => {
        useConfigStore.getState().importConfig(configString);
      });

      const state = getStoreState();
      expect(state.config).toEqual({
        'unknown-option': 'true',
      });

      const output = useConfigStore.getState().exportConfig();
      expect(output).not.toContain('font-size');
      expect(output).not.toContain('desktop-notifications');
      expect(output).not.toContain('cursor-style');
      expect(output).not.toContain('font-synthetic-style');
      expect(output).toContain('unknown-option = true');
      expect(output).toContain(
        '# Warning: contains 1 option outside this schema target; validate with your Ghostty build.'
      );
    });
  });

  describe('exportConfig', () => {
    it('should export config as ghostty format', () => {
      act(() => {
        useConfigStore.getState().setValue('font-size', 16);
        useConfigStore.getState().setValue('font-family', 'JetBrains Mono');
      });

      const output = useConfigStore.getState().exportConfig();

      expect(output).toContain('font-size = 16');
      expect(output).toContain('font-family = "JetBrains Mono"');
      expect(output).toContain(`# Generated by Spectre v${SPECTRE_VERSION}`);
      expect(output).toContain(
        `# Spectre schema target: Ghostty ${GHOSTTY_COMPATIBILITY_VERSION}`
      );
      expect(output).not.toContain('outside this schema target');
    });

    it('should not export default values', () => {
      act(() => {
        useConfigStore.getState().setValue('font-size', 13); // default
      });

      const output = useStoreState().exportConfig();
      expect(output).not.toContain('font-size');
    });

    it('should include theme comment if set', () => {
      act(() => {
        useConfigStore.getState().setValue('font-size', 16);
        useConfigStore.getState().setAppliedTheme('Tokyo Night');
      });

      const output = useConfigStore.getState().exportConfig();
      expect(output).toContain('# Theme: Tokyo Night');
    });

    it('should export palette values using Ghostty index=color syntax', () => {
      act(() => {
        useConfigStore.getState().setValue('palette', ['0=#000000', '1=#ff0000']);
      });

      const output = useConfigStore.getState().exportConfig();
      expect(output).toContain('palette = 0=#000000');
      expect(output).toContain('palette = 1=#ff0000');
    });

    it('should normalize legacy positional palette values during export', () => {
      act(() => {
        useConfigStore.getState().setValue('palette', ['#000000', '#ff0000']);
      });

      const output = useConfigStore.getState().exportConfig();
      expect(output).toContain('palette = 0=#000000');
      expect(output).toContain('palette = 1=#ff0000');
      expect(output).not.toContain('palette = #000000');
    });
  });

  describe('loadConfig', () => {
    it('should load a config object', () => {
      const config = {
        'font-size': 16,
        'font-family': 'JetBrains Mono',
      };

      act(() => {
        useConfigStore.getState().loadConfig(config);
      });

      const state = getStoreState();
      expect(state.config['font-size']).toBe(16);
      expect(state.config['font-family']).toBe('JetBrains Mono');
    });

    it('should set applied theme when provided', () => {
      const config = { 'font-size': 16 };

      act(() => {
        useConfigStore.getState().loadConfig(config, 'Dracula');
      });

      const state = getStoreState();
      expect(state.appliedTheme).toBe('Dracula');
    });
  });

  describe('setAppliedTheme', () => {
    it('should set the applied theme name', () => {
      act(() => {
        useConfigStore.getState().setAppliedTheme('Nord');
      });

      const state = getStoreState();
      expect(state.appliedTheme).toBe('Nord');
    });

    it('should clear applied theme when set to null', () => {
      act(() => {
        useConfigStore.getState().setAppliedTheme('Nord');
      });

      act(() => {
        useConfigStore.getState().setAppliedTheme(null);
      });

      const state = getStoreState();
      expect(state.appliedTheme).toBeNull();
    });
  });

  describe('getDiff', () => {
    it('should return only modified values', () => {
      act(() => {
        useConfigStore.getState().setValue('font-size', 16);
      });

      const diff = useConfigStore.getState().getDiff();
      expect(diff).toEqual({ 'font-size': 16 });
    });
  });
});

// Helper to avoid repeating getStoreState
function useStoreState() {
  return useConfigStore.getState();
}
