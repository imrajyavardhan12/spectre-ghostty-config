import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import SharePage from './page';
import { useConfigStore } from '@/lib/store/config-store';
import { encodeConfig } from '@/lib/utils/url-share';

const pushMock = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => currentSearchParams,
}));

function setSharedConfigParams() {
  const encoded = encodeConfig({ 'font-size': 16 }, 'Dracula');
  currentSearchParams = new URLSearchParams(`c=${encoded}`);
}

describe('SharePage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    setSharedConfigParams();
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('does not load shared config until the user opens it in the editor', () => {
    render(<SharePage />);

    expect(useConfigStore.getState().config).toEqual({});
    expect(useConfigStore.getState().appliedTheme).toBeNull();
  });

  it('loads shared config from the header Open Editor action', () => {
    render(<SharePage />);

    fireEvent.click(screen.getByRole('button', { name: /^Open Editor$/i }));

    expect(useConfigStore.getState().config['font-size']).toBe(16);
    expect(useConfigStore.getState().appliedTheme).toBe('Dracula');
    expect(pushMock).toHaveBeenCalledWith('/editor');
  });

  it('loads shared config from the lower Open in Editor action', () => {
    render(<SharePage />);

    fireEvent.click(screen.getByRole('button', { name: /^Open in Editor$/i }));

    expect(useConfigStore.getState().config['font-size']).toBe(16);
    expect(useConfigStore.getState().appliedTheme).toBe('Dracula');
    expect(pushMock).toHaveBeenCalledWith('/editor');
  });
});
