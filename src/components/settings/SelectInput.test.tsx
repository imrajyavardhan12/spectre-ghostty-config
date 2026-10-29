import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SelectInput } from './SelectInput';
import { getOptionById } from '@/data/ghostty-options';
import { useConfigStore } from '@/lib/store/config-store';
import { GHOSTTY_COMPATIBILITY_VERSION } from '@/lib/compatibility';
import type { EnumOption } from '@/lib/schema/types';

const padding = getOptionById('window-padding-balance') as EnumOption;
const copyOnSelect = getOptionById('copy-on-select') as EnumOption;

const radioNames = () => screen.getAllByRole('radio').map((radio) => radio.textContent);

describe('SelectInput', () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
      // resetAll leaves the target version and the hide toggle alone.
      useConfigStore.getState().setTargetVersion(GHOSTTY_COMPATIBILITY_VERSION);
      useConfigStore.getState().setHideUnsupported(false);
    });
  });

  it('offers every current value on the stable target', () => {
    render(<SelectInput option={padding} />);
    expect(radioNames()).toEqual(['Off', 'On', 'Equal']);
  });

  it('falls back to a select when the label of a newer value no longer fits its segment', () => {
    act(() => {
      useConfigStore.getState().setTargetVersion('1.3.1');
    });
    render(<SelectInput option={padding} />);
    // "Equal (1.4+)" is too long for a three-way control, so it moves into a select.
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getByRole('combobox', { name: 'Balance Padding' }).textContent).toContain('Off');
  });

  it('leaves that value out when newer options are hidden', () => {
    act(() => {
      useConfigStore.getState().setTargetVersion('1.3.1');
      useConfigStore.getState().setHideUnsupported(true);
    });
    render(<SelectInput option={padding} />);
    expect(radioNames()).toEqual(['Off', 'On']);
  });

  it('puts the copy-on-select values in a select that starts on Ghostty default', () => {
    render(<SelectInput option={copyOnSelect} />);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getByRole('combobox', { name: 'Copy on Select' }).textContent).toContain('Ghostty default');
  });

  it('still shows a superseded value that a saved config uses', () => {
    act(() => {
      useConfigStore.getState().setValue('copy-on-select', 'true');
    });
    render(<SelectInput option={copyOnSelect} />);
    expect(screen.getByRole('combobox', { name: 'Copy on Select' }).textContent).toContain('True');
  });

  it('stores the chosen value', () => {
    render(<SelectInput option={padding} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Equal' }));
    expect(useConfigStore.getState().config['window-padding-balance']).toBe('equal');
  });
});
