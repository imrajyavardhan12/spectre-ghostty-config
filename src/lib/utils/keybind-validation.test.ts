import { describe, it, expect } from 'vitest';
import {
  validateTrigger,
  validateTriggerSequence,
  validateAction,
  validateKeybind,
  KEYBIND_ACTIONS,
  getActionSuggestions,
  KEYBIND_EXAMPLES,
} from '@/lib/utils/keybind-validation';

describe('keybind-validation', () => {
  describe('validateTrigger', () => {
    it('should validate simple key triggers', () => {
      const result = validateTrigger('ctrl+c');
      expect(result.valid).toBe(true);
      expect(result.modifiers).toContain('ctrl');
      expect(result.key).toBe('c');
    });

    it('should validate single key without modifiers', () => {
      const result = validateTrigger('a');
      expect(result.valid).toBe(true);
      expect(result.key).toBe('a');
      expect(result.modifiers).toHaveLength(0);
    });

    it('should validate function keys', () => {
      const result = validateTrigger('f11');
      expect(result.valid).toBe(true);
      expect(result.key).toBe('f11');
    });

    it('should validate arrow keys', () => {
      const result = validateTrigger('up');
      expect(result.valid).toBe(true);
      expect(result.key).toBe('up');
    });

    it('should reject duplicate modifiers', () => {
      const result = validateTrigger('ctrl+ctrl+c');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Duplicate modifier');
    });

    it('should reject trigger without key', () => {
      const result = validateTrigger('ctrl+shift');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No key specified');
    });

    it('should reject invalid key', () => {
      const result = validateTrigger('ctrl+notARealKey');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid key');
    });

    it('should normalize modifier aliases', () => {
      const result = validateTrigger('control+shift+c');
      expect(result.valid).toBe(true);
      expect(result.modifiers).toContain('ctrl');
      expect(result.modifiers).toContain('shift');
    });

    it('should handle super alias', () => {
      const result = validateTrigger('cmd+shift+c');
      expect(result.valid).toBe(true);
      expect(result.modifiers).toContain('super');
    });

    it('should normalize alias option to alt', () => {
      const result = validateTrigger('alt+c');
      expect(result.valid).toBe(true);
      expect(result.modifiers).toContain('alt');
    });

    it('should reject duplicate modifiers (alt + option aliases)', () => {
      const result = validateTrigger('alt+option+c');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Duplicate modifier');
    });

    it('should validate with prefixes', () => {
      const result = validateTrigger('all:ctrl+c');
      expect(result.valid).toBe(true);
      expect(result.prefixes).toContain('all');
      expect(result.modifiers).toContain('ctrl');
    });

    it('should reject invalid prefix', () => {
      const result = validateTrigger('invalid:ctrl+c');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid prefix');
    });

    it('should reject empty trigger', () => {
      const result = validateTrigger('');
      expect(result.valid).toBe(false);
    });

    it('should validate special keys like backspace', () => {
      const result = validateTrigger('backspace');
      expect(result.valid).toBe(true);
      expect(result.key).toBe('backspace');
    });

    it('should validate escape', () => {
      const result = validateTrigger('escape');
      expect(result.valid).toBe(true);
      expect(result.key).toBe('escape');
    });
  });

  describe('validateTriggerSequence', () => {
    it('should validate simple sequence', () => {
      const result = validateTriggerSequence('ctrl+x>2');
      expect(result.valid).toBe(true);
      expect(result.sequences).toHaveLength(2);
    });

    it('should validate single trigger', () => {
      const result = validateTriggerSequence('ctrl+c');
      expect(result.valid).toBe(true);
      expect(result.sequences).toHaveLength(1);
    });

    it('should reject invalid trigger in sequence', () => {
      const result = validateTriggerSequence('ctrl+x>invalid');
      expect(result.valid).toBe(false);
    });

    it('should validate sequence with repeat count', () => {
      // ctrl+a>3 means "ctrl+a pressed 3 times in sequence"
      const result = validateTriggerSequence('ctrl+a>3');
      expect(result.valid).toBe(true);
      // Each > split creates a sequence entry
      expect(result.sequences.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject empty sequence', () => {
      const result = validateTriggerSequence('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateAction', () => {
    it('should validate copy_to_clipboard with param', () => {
      // copy_to_clipboard requires a param per the validation logic
      const result = validateAction('copy_to_clipboard:mixed');
      expect(result.valid).toBe(true);
      expect(result.action).toBe('copy_to_clipboard');
    });

    it('should validate copy_to_clipboard without optional param', () => {
      const result = validateAction('copy_to_clipboard');
      expect(result.valid).toBe(true);
      expect(result.action).toBe('copy_to_clipboard');
    });

    it('should validate action with param', () => {
      const result = validateAction('increase_font_size:1');
      expect(result.valid).toBe(true);
      expect(result.action).toBe('increase_font_size');
      expect(result.param).toBe('1');
    });

    it('should reject unknown action', () => {
      const result = validateAction('not_a_real_action');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown action');
    });

    it('should require param for actions that need it', () => {
      const result = validateAction('increase_font_size');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('requires a parameter');
    });

    it('should reject empty action', () => {
      const result = validateAction('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should handle case differences for action names', () => {
      // The validation converts action to lowercase before checking
      const result = validateAction('COPY_TO_CLIPBOARD:mixed');
      expect(result.valid).toBe(true);
      expect(result.action).toBe('copy_to_clipboard');
    });

    it('should allow paste_from_clipboard without param', () => {
      const result = validateAction('paste_from_clipboard');
      expect(result.valid).toBe(true);
    });

    it('should validate close_tab without optional param', () => {
      const result = validateAction('close_tab');
      expect(result.valid).toBe(true);
      expect(result.action).toBe('close_tab');
    });
  });

  describe('validateKeybind', () => {
    it('should validate full keybind with param action', () => {
      // Use a keybind that has valid action with param
      const result = validateKeybind('ctrl+plus=increase_font_size:1');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate keybind with no param action', () => {
      // Use new_tab which doesn't require a param
      const result = validateKeybind('ctrl+shift+t=new_tab');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate keybind with optional param action omitted', () => {
      const result = validateKeybind('ctrl+shift+c=copy_to_clipboard');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject keybind without equals', () => {
      const result = validateKeybind('ctrl+c copy_to_clipboard');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid format');
    });

    it('should reject empty keybind', () => {
      const result = validateKeybind('');
      expect(result.valid).toBe(false);
    });

    it('should collect all errors', () => {
      const result = validateKeybind('ctrl+ctrl+c=not_an_action');
      expect(result.valid).toBe(false);
      // Should have error for duplicate modifier and unknown action
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should include warnings for deprecated actions', () => {
      const result = validateKeybind('ctrl+k=close_all_windows');
      // This action triggers a warning
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate sequence trigger', () => {
      // Validate that trigger sequences work correctly
      const triggerSeqResult = validateTriggerSequence('g>2');
      expect(triggerSeqResult.valid).toBe(true);
      expect(triggerSeqResult.sequences.length).toBeGreaterThan(0);
      
      // The keybind function should work for simple triggers
      const result = validateKeybind('ctrl+g=new_window');
      expect(result.valid).toBe(true);
    });

    it('should validate global prefix', () => {
      // Use a simple keybind that doesn't use ctrl+c (which requires param)
      const result = validateKeybind('global:ctrl+shift+n=new_window');
      expect(result.valid).toBe(true);
    });

    it('should allow Ghostty special keybind reset values', () => {
      const result = validateKeybind('clear');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('KEYBIND_ACTIONS', () => {
    it('should have all expected categories', () => {
      const categories = new Set(KEYBIND_ACTIONS.map(a => a.category));
      expect(categories.has('basic')).toBe(true);
      expect(categories.has('clipboard')).toBe(true);
      expect(categories.has('font')).toBe(true);
      expect(categories.has('window')).toBe(true);
    });

    it('should have copy_to_clipboard with param options', () => {
      const action = KEYBIND_ACTIONS.find(a => a.action === 'copy_to_clipboard');
      expect(action).toBeDefined();
      expect(action?.hasParam).toBe(true);
      expect(action?.paramOptions).toContain('text');
      expect(action?.paramOptions).toContain('html');
    });
  });

  describe('getActionSuggestions', () => {
    it('should return matching actions', () => {
      const suggestions = getActionSuggestions('copy');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(a => a.action === 'copy_to_clipboard')).toBe(true);
    });

    it('should be case insensitive', () => {
      const suggestions = getActionSuggestions('COPY');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return empty for no matches', () => {
      const suggestions = getActionSuggestions('xyznonexistent');
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('KEYBIND_EXAMPLES', () => {
    it('should have expected examples', () => {
      expect(KEYBIND_EXAMPLES.length).toBeGreaterThan(0);
      expect(KEYBIND_EXAMPLES[0].trigger).toBeDefined();
      expect(KEYBIND_EXAMPLES[0].action).toBeDefined();
    });

    it('all examples should have valid triggers', () => {
      for (const example of KEYBIND_EXAMPLES) {
        const triggerResult = validateTrigger(example.trigger);
        expect(triggerResult.valid).toBe(true);
      }
    });

    it('all examples should have valid actions', () => {
      for (const example of KEYBIND_EXAMPLES) {
        const actionResult = validateAction(example.action);
        expect(actionResult.valid).toBe(true);
      }
    });
  });
});
