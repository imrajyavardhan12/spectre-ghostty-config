import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import { RepeatableTextInput } from './RepeatableTextInput';
import { useConfigStore } from '@/lib/store/config-store';
import type { StringOption } from '@/lib/schema/types';

const option: StringOption = {
  id: 'font-family',
  name: 'Font Family',
  description: 'The primary font family to use for text rendering.',
  type: 'string',
  default: '',
  category: 'fonts',
  placeholder: 'JetBrains Mono',
  repeatable: true,
};

describe('RepeatableTextInput', () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('stores one value as a string and multiple values as repeatable strings', () => {
    render(<RepeatableTextInput option={option} />);

    const input = screen.getByPlaceholderText('JetBrains Mono');
    const addButton = screen.getByLabelText('Add Font Family value');

    fireEvent.change(input, { target: { value: 'JetBrains Mono' } });
    fireEvent.click(addButton);

    expect(useConfigStore.getState().config['font-family']).toBe('JetBrains Mono');
    expect(screen.getByText('JetBrains Mono')).toBeTruthy();

    fireEvent.change(input, { target: { value: 'Symbols Nerd Font' } });
    fireEvent.click(addButton);

    expect(useConfigStore.getState().config['font-family']).toEqual([
      'JetBrains Mono',
      'Symbols Nerd Font',
    ]);
  });

  it('preserves repeatable values that contain equals signs', () => {
    const envOption: StringOption = {
      id: 'env',
      name: 'Environment Variables',
      description: 'Additional environment variables to set.',
      type: 'string',
      default: '',
      category: 'shell',
      repeatable: true,
    };

    render(<RepeatableTextInput option={envOption} />);

    const input = screen.getByPlaceholderText('Add environment variables');
    const addButton = screen.getByLabelText('Add Environment Variables value');

    fireEvent.change(input, { target: { value: 'EDITOR=nvim' } });
    fireEvent.click(addButton);
    fireEvent.change(input, { target: { value: 'PATH=/usr/local/bin' } });
    fireEvent.click(addButton);

    expect(useConfigStore.getState().config.env).toEqual([
      'EDITOR=nvim',
      'PATH=/usr/local/bin',
    ]);
  });

  it('removes values and resets the option when the last value is removed', () => {
    act(() => {
      useConfigStore.getState().setValue('font-family', [
        'JetBrains Mono',
        'Symbols Nerd Font',
      ]);
    });

    render(<RepeatableTextInput option={option} />);

    fireEvent.click(screen.getByLabelText('Remove Font Family value 1'));
    expect(useConfigStore.getState().config['font-family']).toBe('Symbols Nerd Font');

    fireEvent.click(screen.getByLabelText('Remove Font Family value 1'));
    expect(useConfigStore.getState().config['font-family']).toBeUndefined();
  });
});
