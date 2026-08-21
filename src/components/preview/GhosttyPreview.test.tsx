'use client';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { useConfigStore } from '@/lib/store/config-store';
import { GhosttyPreview } from './GhosttyPreview';

interface MockTerminalInstance {
  options: Record<string, unknown>;
  loadAddon: ReturnType<typeof vi.fn>;
  open: ReturnType<typeof vi.fn>;
  write: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}

interface MockFitAddonInstance {
  fit: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}

const mocks = vi.hoisted(() => ({
  initGhosttyMock: vi.fn(),
  terminalInstances: [] as MockTerminalInstance[],
  fitAddonInstances: [] as MockFitAddonInstance[],
  failNextOpen: false,
}));

vi.mock('@/lib/ghostty/init', () => ({
  initGhostty: mocks.initGhosttyMock,
}));

vi.mock('ghostty-web', () => {
  class MockTerminal {
    options: Record<string, unknown>;
    loadAddon = vi.fn();
    open = vi.fn(() => {
      if (mocks.failNextOpen) {
        mocks.failNextOpen = false;
        throw new Error('open failed');
      }
    });
    write = vi.fn();
    dispose = vi.fn();

    constructor(options: Record<string, unknown>) {
      this.options = options;
      mocks.terminalInstances.push(this);
    }
  }

  class MockFitAddon {
    fit = vi.fn();
    dispose = vi.fn();

    constructor() {
      mocks.fitAddonInstances.push(this);
    }
  }

  return {
    FitAddon: MockFitAddon,
    Terminal: MockTerminal,
    init: vi.fn(),
  };
});

describe('GhosttyPreview lifecycle', () => {
  beforeEach(() => {
    mocks.initGhosttyMock.mockReset();
    mocks.initGhosttyMock.mockResolvedValue(undefined);
    mocks.terminalInstances.length = 0;
    mocks.fitAddonInstances.length = 0;
    mocks.failNextOpen = false;
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not attach a terminal when initialization finishes after close', async () => {
    let resolveInitialization!: () => void;
    mocks.initGhosttyMock.mockImplementationOnce(
      () => new Promise<void>((resolve) => {
        resolveInitialization = resolve;
      })
    );

    const { rerender } = render(
      <GhosttyPreview isOpen onToggle={vi.fn()} />
    );
    await waitFor(() => expect(mocks.initGhosttyMock).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('status')).toHaveTextContent('Loading Ghostty WASM...');

    rerender(<GhosttyPreview isOpen={false} onToggle={vi.fn()} />);

    await act(async () => {
      resolveInitialization();
    });

    await waitFor(() => expect(mocks.terminalInstances).toHaveLength(0));

    rerender(<GhosttyPreview isOpen onToggle={vi.fn()} />);
    await waitFor(() => expect(mocks.terminalInstances).toHaveLength(1));
    expect(mocks.terminalInstances[0].open).toHaveBeenCalledTimes(1);
  });

  it('disposes the active terminal before creating a new one on reopen', async () => {
    const { rerender } = render(
      <GhosttyPreview isOpen onToggle={vi.fn()} />
    );
    await waitFor(() => expect(mocks.terminalInstances).toHaveLength(1));

    rerender(<GhosttyPreview isOpen={false} onToggle={vi.fn()} />);
    expect(mocks.terminalInstances[0].dispose).toHaveBeenCalledTimes(1);
    expect(mocks.fitAddonInstances[0].dispose).toHaveBeenCalledTimes(1);

    rerender(<GhosttyPreview isOpen onToggle={vi.fn()} />);
    await waitFor(() => expect(mocks.terminalInstances).toHaveLength(2));
    expect(mocks.terminalInstances[1].open).toHaveBeenCalledTimes(1);
  });

  it('lets a newer config creation supersede an in-flight request', async () => {
    let resolveStaleCreation!: () => void;
    mocks.initGhosttyMock
      .mockResolvedValueOnce(undefined)
      .mockImplementationOnce(
        () => new Promise<void>((resolve) => {
          resolveStaleCreation = resolve;
        })
      )
      .mockResolvedValueOnce(undefined);

    render(<GhosttyPreview isOpen onToggle={vi.fn()} />);
    await waitFor(() => expect(mocks.terminalInstances).toHaveLength(1));

    act(() => {
      useConfigStore.getState().setValue('font-size', 14);
    });
    await waitFor(
      () => expect(mocks.initGhosttyMock).toHaveBeenCalledTimes(2),
      { timeout: 1_000 }
    );

    act(() => {
      useConfigStore.getState().setValue('font-size', 16);
    });
    await waitFor(
      () => expect(mocks.terminalInstances).toHaveLength(2),
      { timeout: 1_000 }
    );

    await act(async () => {
      resolveStaleCreation();
    });

    expect(mocks.terminalInstances).toHaveLength(2);
    expect(mocks.terminalInstances[0].dispose).toHaveBeenCalledTimes(1);
    expect(mocks.terminalInstances[1].options.fontSize).toBe(16);
  });

  it('disposes partially created resources and announces open failures', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.failNextOpen = true;

    render(<GhosttyPreview isOpen onToggle={vi.fn()} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Failed to load preview');
    expect(alert).toHaveTextContent('open failed');
    expect(mocks.terminalInstances[0].dispose).toHaveBeenCalledTimes(1);
    expect(mocks.fitAddonInstances[0].dispose).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
  });
});
