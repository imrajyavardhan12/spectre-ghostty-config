import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ImportReviewDialog } from './ImportReviewDialog';
import { analyzeGhosttyConfig } from '@/lib/utils/config-import-analysis';

describe('ImportReviewDialog', () => {
  it('shows valid imported instructions before confirmation', async () => {
    const analysis = analyzeGhosttyConfig(`
font-size = 16
font-family = "JetBrains Mono"
cursor-style = bar
`);
    const onConfirm = vi.fn();

    render(
      <ImportReviewDialog
        open
        fileName="config"
        fileSize={96}
        currentSettingCount={2}
        analysis={analysis}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Review imported configuration' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2 current settings will be replaced\./)
    ).toBeInTheDocument();
    expect(screen.getByText('font-size = 16')).toBeInTheDocument();
    expect(screen.getByText('font-family = JetBrains Mono')).toBeInTheDocument();
    expect(screen.getByText('cursor-style = bar')).toBeInTheDocument();

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    await waitFor(() => expect(cancel).toHaveFocus());

    fireEvent.click(screen.getByRole('button', { name: 'Replace with 3 settings' }));
    expect(onConfirm).toHaveBeenCalledWith(analysis.candidateConfig);
  });

  it('uses explicit defaults-only action copy for a meaningful empty result', () => {
    const analysis = analyzeGhosttyConfig('font-size = 13\ncursor-style =\n');

    render(
      <ImportReviewDialog
        open
        fileName="config"
        fileSize={32}
        currentSettingCount={2}
        analysis={analysis}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Replace current config with defaults' })
    ).toBeEnabled();
    expect(screen.getByText('cursor-style = (reset to default)')).toBeInTheDocument();
  });

  it('disables replacement when no meaningful instruction exists', () => {
    const analysis = analyzeGhosttyConfig('# comment only\nnot an instruction\n');

    render(
      <ImportReviewDialog
        open
        fileName="config"
        fileSize={34}
        currentSettingCount={2}
        analysis={analysis}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Nothing usable to apply' })
    ).toBeDisabled();
  });
});
