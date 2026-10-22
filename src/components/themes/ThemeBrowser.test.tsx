'use client';

import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeBrowser } from './ThemeBrowser';

const { fetchThemeListMock, fetchThemeMock } = vi.hoisted(() => ({
  fetchThemeListMock: vi.fn(),
  fetchThemeMock: vi.fn(),
}));

vi.mock('@/lib/utils/themes', () => ({
  FEATURED_THEMES: ['Featured'],
  categorizeTheme: (theme: { colors: { background: string } }) =>
    theme.colors.background === '#ffffff' ? 'light' : 'dark',
  fetchThemeList: fetchThemeListMock,
  fetchTheme: fetchThemeMock,
  themeToConfig: () => ({ background: '#000000', foreground: '#ffffff' }),
}));

vi.mock('./ThemeCard', () => ({
  ThemeCard: ({
    theme,
    onApply,
  }: {
    theme: { name: string };
    onApply: (theme: { name: string }) => void;
  }) => (
    <button type="button" onClick={() => onApply(theme)}>
      {theme.name}
    </button>
  ),
  ThemeCardSkeleton: () => <div data-testid="theme-skeleton" />,
}));

function createTheme(name: string) {
  return {
    name,
    colors: {
      background: '#000000',
      foreground: '#ffffff',
      palette: Array(16).fill(''),
    },
    raw: '',
  };
}

function createThemeList(names: string[]) {
  return names.map((name) => ({
    name,
    downloadUrl: `https://example.test/${encodeURIComponent(name)}`,
  }));
}

describe('ThemeBrowser loading lifecycle', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('deduplicates overlapping loads and limits theme fetches to six at a time', async () => {
    const names = ['Featured', ...Array.from({ length: 10 }, (_, index) => `Theme ${index}`)];
    const resolvers = new Map<string, () => void>();
    let activeRequests = 0;
    let maxActiveRequests = 0;

    fetchThemeListMock.mockResolvedValue(createThemeList(names));
    fetchThemeMock.mockImplementation((name: string) => {
      return new Promise<void>((resolve) => {
        activeRequests += 1;
        maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
        resolvers.set(name, () => {
          activeRequests -= 1;
          resolve();
        });
      }).then(() => createTheme(name));
    });

    render(<ThemeBrowser />);
    await waitFor(() => expect(fetchThemeMock).toHaveBeenCalledWith(
      'Featured',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    ));

    // Request all themes while Featured is still in flight. The scheduler can
    // fill the remaining slots, but it must reuse Featured's existing task.
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    await waitFor(() => expect(fetchThemeMock).toHaveBeenCalledTimes(6));
    expect(maxActiveRequests).toBe(6);

    const firstWave = fetchThemeMock.mock.calls.map(([name]) => name as string);
    await act(async () => {
      firstWave.forEach((name) => resolvers.get(name)?.());
    });

    await waitFor(() => expect(fetchThemeMock).toHaveBeenCalledTimes(11));
    expect(maxActiveRequests).toBe(6);

    const requestedNames = fetchThemeMock.mock.calls.map(([name]) => name as string);
    await act(async () => {
      requestedNames.slice(6).forEach((name) => resolvers.get(name)?.());
    });

    await waitFor(() => expect(screen.getByText('All 11 themes loaded')).toBeInTheDocument());
    expect(requestedNames).toHaveLength(new Set(requestedNames).size);
    expect(requestedNames).toEqual(names);
  });

  it('prioritizes the latest search over older queued filter work', async () => {
    const names = [
      'Featured',
      ...Array.from({ length: 10 }, (_, index) => `Theme ${index}`),
      'Target Theme',
    ];
    const resolvers = new Map<string, () => void>();

    fetchThemeListMock.mockResolvedValue(createThemeList(names));
    fetchThemeMock.mockImplementation((name: string) => {
      return new Promise<void>((resolve) => {
        resolvers.set(name, resolve);
      }).then(() => createTheme(name));
    });

    render(<ThemeBrowser />);
    await waitFor(() => expect(fetchThemeMock).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    await waitFor(() => expect(fetchThemeMock).toHaveBeenCalledTimes(6));

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search themes' }), {
      target: { value: 'Target' },
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    await act(async () => {
      resolvers.get('Featured')?.();
    });

    await waitFor(() => expect(fetchThemeMock).toHaveBeenCalledTimes(7));
    expect(fetchThemeMock.mock.calls[6][0]).toBe('Target Theme');
  });

  it('keeps concurrency slots occupied until aborted requests settle', async () => {
    const oldNames = Array.from({ length: 6 }, (_, index) => `Old Theme ${index}`);
    const names = [...oldNames, 'New Theme'];
    const resolvers = new Map<string, () => void>();
    const signals = new Map<string, AbortSignal>();

    fetchThemeListMock.mockResolvedValue(createThemeList(names));
    fetchThemeMock.mockImplementation(
      (name: string, options: { signal: AbortSignal }) => {
        signals.set(name, options.signal);
        if (name === 'New Theme') {
          return Promise.resolve(createTheme(name));
        }
        return new Promise<void>((resolve) => {
          resolvers.set(name, resolve);
        }).then(() => createTheme(name));
      }
    );

    render(<ThemeBrowser />);
    await waitFor(() => {
      expect(screen.getByText('0 of 7 themes loaded')).toBeInTheDocument();
    });
    const search = screen.getByRole('searchbox', { name: 'Search themes' });
    fireEvent.change(search, { target: { value: 'Old' } });
    await waitFor(
      () => expect(fetchThemeMock).toHaveBeenCalledTimes(6),
      { timeout: 1_000 }
    );

    fireEvent.change(search, { target: { value: 'New' } });
    await waitFor(() => {
      expect(oldNames.every((name) => signals.get(name)?.aborted)).toBe(true);
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    // The replacement remains queued because the six aborted promises have
    // deliberately not settled yet.
    expect(fetchThemeMock).toHaveBeenCalledTimes(6);

    await act(async () => {
      resolvers.get(oldNames[0])?.();
    });
    await waitFor(() => expect(fetchThemeMock).toHaveBeenCalledTimes(7));
    expect(fetchThemeMock.mock.calls[6][0]).toBe('New Theme');
  });

  it('aborts work that was only needed by a superseded search', async () => {
    let oldSearchSignal: AbortSignal | undefined;
    fetchThemeListMock.mockResolvedValue(
      createThemeList(['Featured', 'Old Theme', 'New Theme'])
    );
    fetchThemeMock.mockImplementation(
      (name: string, options: { signal?: AbortSignal }) => {
        if (name === 'Old Theme') {
          oldSearchSignal = options.signal;
          return new Promise((_resolve, reject) => {
            options.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          });
        }
        return Promise.resolve(createTheme(name));
      }
    );

    render(<ThemeBrowser />);
    await waitFor(() => expect(screen.getByText('1 of 3 themes loaded')).toBeInTheDocument());

    const search = screen.getByRole('searchbox', { name: 'Search themes' });
    fireEvent.change(search, { target: { value: 'Old' } });
    await waitFor(
      () => expect(fetchThemeMock).toHaveBeenCalledWith(
        'Old Theme',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      ),
      { timeout: 1_000 }
    );

    fireEvent.change(search, { target: { value: 'New' } });
    await waitFor(() => expect(oldSearchSignal?.aborted).toBe(true));
    await waitFor(
      () => expect(fetchThemeMock).toHaveBeenCalledWith(
        'New Theme',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      ),
      { timeout: 1_000 }
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'New Theme' })).toBeInTheDocument());
    expect(screen.queryByText(/failed to load/i)).not.toBeInTheDocument();
  });

  it('reports individual download failures and retries them', async () => {
    fetchThemeListMock.mockResolvedValue(createThemeList(['Featured']));
    fetchThemeMock
      .mockRejectedValueOnce(new Error('theme service unavailable'))
      .mockResolvedValueOnce(createTheme('Featured'));

    render(<ThemeBrowser />);

    await waitFor(() => {
      expect(screen.getByText('1 theme failed to load.')).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Retry failed theme' })
    );

    await waitFor(() => {
      expect(screen.getByText('1 theme loaded')).toBeInTheDocument();
      expect(screen.queryByText('1 theme failed to load.')).not.toBeInTheDocument();
    });
    expect(fetchThemeMock).toHaveBeenCalledTimes(2);
  });

  it('aborts the theme request when the browser unmounts', async () => {
    let requestSignal: AbortSignal | undefined;
    fetchThemeListMock.mockResolvedValue(createThemeList(['Featured']));
    fetchThemeMock.mockImplementation((_name: string, options: { signal?: AbortSignal }) => {
      requestSignal = options.signal;
      return new Promise(() => undefined);
    });

    const { unmount } = render(<ThemeBrowser />);
    await waitFor(() => expect(requestSignal).toBeDefined());

    unmount();

    expect(requestSignal?.aborted).toBe(true);
  });

  it('aborts the replayed list request and avoids duplicate theme downloads in Strict Mode', async () => {
    fetchThemeListMock.mockResolvedValue(createThemeList(['Featured']));
    fetchThemeMock.mockResolvedValue(createTheme('Featured'));

    render(
      <StrictMode>
        <ThemeBrowser />
      </StrictMode>
    );

    await waitFor(() => expect(screen.getByText('1 theme loaded')).toBeInTheDocument());
    expect(fetchThemeListMock).toHaveBeenCalledTimes(2);
    const firstSignal = fetchThemeListMock.mock.calls[0][0].signal as AbortSignal;
    const currentSignal = fetchThemeListMock.mock.calls[1][0].signal as AbortSignal;
    expect(firstSignal.aborted).toBe(true);
    expect(currentSignal.aborted).toBe(false);
    expect(fetchThemeMock).toHaveBeenCalledTimes(1);
  });

  it('refetches the theme list from Try again without reloading the page', async () => {
    fetchThemeListMock
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(createThemeList(['Featured']));
    fetchThemeMock.mockResolvedValue(createTheme('Featured'));

    render(<ThemeBrowser />);
    expect(await screen.findByText('Failed to load themes')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('button', { name: 'Featured' })).toBeInTheDocument();
    expect(screen.queryByText('Failed to load themes')).not.toBeInTheDocument();
    expect(fetchThemeListMock).toHaveBeenCalledTimes(2);
  });

  it('explains an empty search, offers to load every theme, and clears the search', async () => {
    fetchThemeListMock.mockResolvedValue(createThemeList(['Featured', 'Other']));
    fetchThemeMock.mockImplementation((name: string) => Promise.resolve(createTheme(name)));

    render(<ThemeBrowser />);
    await waitFor(() => expect(screen.getByText('1 of 2 themes loaded')).toBeInTheDocument());

    const search = screen.getByRole('searchbox', { name: 'Search themes' });
    fireEvent.change(search, { target: { value: 'zzz' } });

    expect(await screen.findByText('No themes found')).toBeInTheDocument();
    expect(screen.getByText(/Nothing matches “zzz” in featured themes\./)).toBeInTheDocument();
    expect(screen.getByText(/Only 1 theme is loaded\./)).toBeInTheDocument();
    // The status line and the empty state each offer it.
    expect(screen.getAllByRole('button', { name: 'Load all themes' })).toHaveLength(2);

    // The field has its own clear control; the empty state's button comes last.
    const clearButtons = screen.getAllByRole('button', { name: 'Clear search' });
    expect(clearButtons).toHaveLength(2);
    fireEvent.click(clearButtons[1]);
    expect(search).toHaveValue('');
    await waitFor(() => expect(screen.queryByText('No themes found')).not.toBeInTheDocument());
    expect(within(document.getElementById('theme-results')!).getByRole('button', { name: 'Featured' })).toBeInTheDocument();
  });

  it('reports the applied theme to the page', async () => {
    const onApplied = vi.fn();
    fetchThemeListMock.mockResolvedValue(createThemeList(['Featured']));
    fetchThemeMock.mockResolvedValue(createTheme('Featured'));

    render(<ThemeBrowser onApplied={onApplied} />);
    await waitFor(() => expect(document.getElementById('theme-results')).not.toBeNull());
    fireEvent.click(within(document.getElementById('theme-results')!).getByRole('button', { name: 'Featured' }));

    expect(onApplied).toHaveBeenCalledWith(expect.objectContaining({ name: 'Featured' }));
  });

  it('treats a whitespace-only search as no search', async () => {
    fetchThemeListMock.mockResolvedValue(createThemeList(['Featured']));
    fetchThemeMock.mockResolvedValue(createTheme('Featured'));

    render(<ThemeBrowser />);
    await waitFor(() => expect(document.getElementById('theme-results')).not.toBeNull());

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search themes' }), {
      target: { value: '   ' },
    });

    expect(within(document.getElementById('theme-results')!).getByRole('button', { name: 'Featured' })).toBeInTheDocument();
    expect(screen.queryByText('No themes found')).not.toBeInTheDocument();
  });

  it('offers no way to load more when the list is empty', async () => {
    fetchThemeListMock.mockResolvedValue([]);

    render(<ThemeBrowser />);

    expect(await screen.findByText('No themes found')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load all themes' })).not.toBeInTheDocument();
    expect(screen.queryByText(/themes loaded/)).not.toBeInTheDocument();
  });
});
