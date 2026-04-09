import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useConfigStore } from '@/lib/store/config-store';
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
`;

      act(() => {
        useConfigStore.getState().importConfig(configString);
      });

      const state = getStoreState();
      expect(state.config['keybind']).toEqual([
        'ctrl+shift+c=copy_to_clipboard',
        'ctrl+shift+v=paste_from_clipboard',
      ]);
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
      expect(output).toContain('# Generated by Spectre');
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
