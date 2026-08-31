import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ConfigOption, StringOption } from '@/lib/schema/types';
import { SettingRenderer } from './SettingRenderer';

// Mock the child components
vi.mock('./TextInput', () => ({
  TextInput: ({ option }: { option: ConfigOption }) => (
    <div data-testid="text-input">{option.name}</div>
  ),
}));

vi.mock('./TextInputWithSuggestions', () => ({
  TextInputWithSuggestions: ({ option }: { option: StringOption }) => (
    <div data-testid="text-input-suggestions">{option.name}</div>
  ),
}));

vi.mock('./RepeatableTextInput', () => ({
  RepeatableTextInput: ({ option }: { option: StringOption }) => (
    <div data-testid="repeatable-text-input">{option.name}</div>
  ),
}));

vi.mock('./NumberInput', () => ({
  NumberInput: ({ option }: { option: ConfigOption }) => (
    <div data-testid="number-input">{option.name}</div>
  ),
}));

vi.mock('./SwitchInput', () => ({
  SwitchInput: ({ option }: { option: ConfigOption }) => (
    <div data-testid="switch-input">{option.name}</div>
  ),
}));

vi.mock('./SelectInput', () => ({
  SelectInput: ({ option }: { option: ConfigOption }) => (
    <div data-testid="select-input">{option.name}</div>
  ),
}));

vi.mock('./ColorInput', () => ({
  ColorInput: ({ option }: { option: ConfigOption }) => (
    <div data-testid="color-input">{option.name}</div>
  ),
}));

vi.mock('./PaletteInput', () => ({
  PaletteInput: ({ option }: { option: ConfigOption }) => (
    <div data-testid="palette-input">{option.name}</div>
  ),
}));

vi.mock('./KeybindInput', () => ({
  KeybindInput: ({ option }: { option: ConfigOption }) => (
    <div data-testid="keybind-input">{option.name}</div>
  ),
}));

vi.mock('./DurationInput', () => ({
  DurationInput: ({ option }: { option: ConfigOption }) => (
    <div data-testid="duration-input">{option.name}</div>
  ),
}));

vi.mock('./IconInput', () => ({
  IconInput: ({ option }: { option: ConfigOption }) => (
    <div data-testid="icon-input">{option.name}</div>
  ),
}));

vi.mock('./FrameInput', () => ({
  FrameInput: ({ option }: { option: ConfigOption }) => (
    <div data-testid="frame-input">{option.name}</div>
  ),
}));

describe('SettingRenderer', () => {
  it('should render string type with TextInput', () => {
    const option = {
      id: 'font-family',
      name: 'Font Family',
      description: 'Font family',
      type: 'string' as const,
      default: '',
      category: 'fonts' as const,
    };

    render(<SettingRenderer option={option} />);
    expect(screen.getByTestId('text-input')).toBeTruthy();
  });

  it('should render string type with TextInputWithSuggestions when validValues exists', () => {
    const option = {
      id: 'cursor-style',
      name: 'Cursor Style',
      description: 'Cursor style',
      type: 'string' as const,
      default: '',
      category: 'cursor' as const,
      validValues: [
        { value: 'block', label: 'Block' },
        { value: 'bar', label: 'Bar' },
      ],
    };

    render(<SettingRenderer option={option} />);
    expect(screen.getByTestId('text-input-suggestions')).toBeTruthy();
  });

  it('should render repeatable string type with RepeatableTextInput', () => {
    const option = {
      id: 'font-family',
      name: 'Font Family',
      description: 'Font family',
      type: 'string' as const,
      default: '',
      category: 'fonts' as const,
      repeatable: true,
    };

    render(<SettingRenderer option={option} />);
    expect(screen.getByTestId('repeatable-text-input')).toBeTruthy();
  });

  it('should render number type with NumberInput', () => {
    const option = {
      id: 'font-size',
      name: 'Font Size',
      description: 'Font size in points',
      type: 'number' as const,
      numberKind: 'float' as const,
      floatBits: 32 as const,
      default: 13,
      category: 'fonts' as const,
      min: 4,
      max: 128,
    };

    render(<SettingRenderer option={option} />);
    expect(screen.getByTestId('number-input')).toBeTruthy();
  });

  it('should render boolean type with SwitchInput', () => {
    const option = {
      id: 'mouse-hide-while-typing',
      name: 'Mouse Hide While Typing',
      description: 'Hide mouse while typing',
      type: 'boolean' as const,
      default: false,
      category: 'mouse' as const,
    };

    render(<SettingRenderer option={option} />);
    expect(screen.getByTestId('switch-input')).toBeTruthy();
  });

  it('should render enum type with SelectInput', () => {
    const option = {
      id: 'cursor-style',
      name: 'Cursor Style',
      description: 'Cursor style',
      type: 'enum' as const,
      default: 'block',
      category: 'cursor' as const,
      options: [
        { value: 'block', label: 'Block' },
        { value: 'underline', label: 'Underline' },
      ],
    };

    render(<SettingRenderer option={option} />);
    expect(screen.getByTestId('select-input')).toBeTruthy();
  });

  it('should render color type with ColorInput', () => {
    const option = {
      id: 'background',
      name: 'Background',
      description: 'Background color',
      type: 'color' as const,
      default: '#000000',
      category: 'colors' as const,
    };

    render(<SettingRenderer option={option} />);
    expect(screen.getByTestId('color-input')).toBeTruthy();
  });

  it('should render palette type with PaletteInput', () => {
    const option = {
      id: 'palette',
      name: 'Color Palette',
      description: 'Terminal color palette',
      type: 'palette' as const,
      default: [],
      category: 'colors' as const,
    };

    render(<SettingRenderer option={option} />);
    expect(screen.getByTestId('palette-input')).toBeTruthy();
  });

  it('should render keybind type with KeybindInput', () => {
    const option = {
      id: 'keybind',
      name: 'Keybindings',
      description: 'Custom keybindings',
      type: 'keybind' as const,
      default: [],
      category: 'keybinds' as const,
    };

    render(<SettingRenderer option={option} />);
    expect(screen.getByTestId('keybind-input')).toBeTruthy();
  });

  it('should render duration type with DurationInput', () => {
    const option = {
      id: 'resize-overlay-duration',
      name: 'Resize Overlay Duration',
      description: 'How long to show resize overlay',
      type: 'duration' as const,
      default: '500ms',
      category: 'advanced' as const,
    };

    render(<SettingRenderer option={option} />);
    expect(screen.getByTestId('duration-input')).toBeTruthy();
  });

  it('should render macos-icon with IconInput', () => {
    const option = {
      id: 'macos-icon',
      name: 'macOS Icon',
      description: 'Custom macOS icon',
      type: 'string' as const,
      default: '',
      category: 'macos' as const,
    };

    render(<SettingRenderer option={option} />);
    expect(screen.getByTestId('icon-input')).toBeTruthy();
  });

  it('should render macos-icon-frame with FrameInput', () => {
    const option = {
      id: 'macos-icon-frame',
      name: 'macOS Icon Frame',
      description: 'Icon frame style',
      type: 'string' as const,
      default: '',
      category: 'macos' as const,
    };

    render(<SettingRenderer option={option} />);
    expect(screen.getByTestId('frame-input')).toBeTruthy();
  });

  it('should show unsupported message for unknown type', () => {
    // Using type assertion to test unknown type handling
    const option = {
      id: 'unknown',
      name: 'Unknown Option',
      description: 'Unknown type',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: 'unknown' as any,
      default: '',
      category: 'advanced' as const,
    };

    render(<SettingRenderer option={option as ConfigOption} />);
    expect(screen.getByText(/Unsupported option type/)).toBeTruthy();
  });
});
