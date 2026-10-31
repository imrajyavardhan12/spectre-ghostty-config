import { beforeEach, describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { PaletteInput } from './PaletteInput';
import { getOptionById } from '@/data/ghostty-options';
import { useConfigStore } from '@/lib/store/config-store';
import type { PaletteOption } from '@/lib/schema/types';

const option = getOptionById('palette') as PaletteOption;

describe('PaletteInput', () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('paints a swatch for every color form Ghostty reads, including those added in 1.4', () => {
    act(() => {
      useConfigStore.getState().setValue('palette', ['1=rgb:ff/00/00', '2=rgbi:0/1/0', '3=#0000ffff0000', '4=abcdef', '5=red']);
    });
    const { container } = render(<PaletteInput option={option} />);
    const swatches = [...container.querySelectorAll('button')].map((button) => button.style.backgroundColor);

    expect(swatches).toEqual(expect.arrayContaining(['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(171, 205, 239)', 'red']));
  });
});
