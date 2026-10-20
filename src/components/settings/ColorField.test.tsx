import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ColorField, toCssColor } from './ColorField';
import { ColorInput } from './ColorInput';
import { getOptionById } from '@/data/ghostty-options';
import { useConfigStore } from '@/lib/store/config-store';
import type { ColorOption } from '@/lib/schema/types';

const option = getOptionById('background') as ColorOption;

function StoreField() {
  const value = (useConfigStore((s) => s.config.background) as string | undefined) ?? '';
  return (
    <>
      <label htmlFor="bg">Background</label>
      <ColorField
        option={option}
        id="bg"
        label="Background"
        value={value}
        onChange={(color) => useConfigStore.getState().setValue('background', color)}
      />
    </>
  );
}

describe('toCssColor', () => {
  it('adds the # Ghostty lets you leave off, and leaves everything else alone', () => {
    expect(toCssColor('fff')).toBe('#fff');
    expect(toCssColor('1A2b3C')).toBe('#1A2b3C');
    expect(toCssColor('#123456')).toBe('#123456');
    expect(toCssColor('red')).toBe('red');
    expect(toCssColor('12345')).toBe('12345');
  });
});

describe('ColorField', () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('keeps what was typed while it stays valid, so "navy blue" can be typed', () => {
    render(<StoreField />);
    const input = screen.getByLabelText('Background') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'navy' } });
    fireEvent.change(input, { target: { value: 'navy ' } });

    expect(useConfigStore.getState().config.background).toBe('navy');
    expect(input.value).toBe('navy ');

    fireEvent.change(input, { target: { value: 'navy blue' } });
    expect(useConfigStore.getState().config.background).toBe('navy blue');
  });

  it('lets a change from elsewhere win over text that is not a color yet', () => {
    render(<StoreField />);
    const input = screen.getByLabelText('Background') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '#12345' } });
    expect(input.getAttribute('aria-invalid')).toBe('true');

    act(() => {
      useConfigStore.getState().setValue('background', '#abcdef');
    });

    expect(input.value).toBe('#abcdef');
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('paints a spaced X11 name that CSS spells without the spaces', () => {
    render(<StoreField />);

    fireEvent.change(screen.getByLabelText('Background'), { target: { value: 'medium spring green' } });

    const swatch = screen.getByRole('button', { name: 'Choose Background' }).firstElementChild as HTMLElement;
    expect(swatch.style.backgroundColor).toBe('mediumspringgreen');
  });

  it('opens the native picker on the stored color, short hex included', () => {
    render(<StoreField />);

    fireEvent.change(screen.getByLabelText('Background'), { target: { value: '#fff' } });
    fireEvent.click(screen.getByRole('button', { name: 'Choose Background' }));

    expect((screen.getByLabelText('Background picker') as HTMLInputElement).value).toBe('#ffffff');
  });

  it('lets a change from elsewhere win over the typed text', () => {
    render(<StoreField />);
    const input = screen.getByLabelText('Background') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '#123abc' } });
    act(() => {
      useConfigStore.getState().resetValue('background');
    });

    expect(input.value).toBe('');
  });

  it('flags text that is not a color and does not store it', () => {
    render(<StoreField />);
    const input = screen.getByLabelText('Background');

    fireEvent.change(input, { target: { value: '#12345' } });

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('alert').textContent).toContain('Not applied until fixed.');
    expect(useConfigStore.getState().config.background).toBeUndefined();
  });

  it('paints the swatch with the color, including a bare hex value', () => {
    render(<StoreField />);

    fireEvent.change(screen.getByLabelText('Background'), { target: { value: '112233' } });

    const swatch = screen.getByRole('button', { name: 'Choose Background' }).firstElementChild as HTMLElement;
    expect(swatch.style.backgroundColor).toBe('rgb(17, 34, 51)');
  });

  it('picks a preset, then goes back to the default and closes', () => {
    render(<StoreField />);

    fireEvent.click(screen.getByRole('button', { name: 'Choose Background' }));
    fireEvent.click(screen.getByRole('button', { name: '#e94560' }));
    expect(useConfigStore.getState().config.background).toBe('#e94560');
    expect((screen.getByLabelText('Background') as HTMLInputElement).value).toBe('#e94560');

    fireEvent.click(screen.getByRole('button', { name: 'Use default' }));
    expect(useConfigStore.getState().config.background).toBeUndefined();
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
  });

  it('closes the picker with Done and keeps the color', () => {
    render(<StoreField />);

    fireEvent.click(screen.getByRole('button', { name: 'Choose Background' }));
    fireEvent.click(screen.getByRole('button', { name: '#ffffff' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
    expect(useConfigStore.getState().config.background).toBe('#ffffff');
  });
});

describe('ColorInput', () => {
  it('names the swatch after the setting', () => {
    render(<ColorInput option={option} />);

    expect(screen.getByRole('button', { name: `Choose ${option.name}` })).toBeTruthy();
  });
});
