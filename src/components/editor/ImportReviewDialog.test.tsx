import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ImportReviewDialog } from './ImportReviewDialog';
import { analyzeGhosttyConfig } from '@/lib/utils/config-import-analysis';

function expectImportedInstruction(key: string, text: string) {
  expect(screen.getByRole('link', { name: key }).closest('li')).toHaveTextContent(text);
}

function expectImportIssue(text: string | RegExp) {
  expect(screen.getByRole('list', { name: 'Import issues' })).toHaveTextContent(text);
}

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
    expectImportedInstruction('font-size', 'font-size = 16');
    expectImportedInstruction('font-family', 'font-family = JetBrains Mono');
    expectImportedInstruction('cursor-style', 'cursor-style = bar');

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    await waitFor(() => expect(cancel).toHaveFocus());

    fireEvent.click(screen.getByRole('button', { name: 'Replace with 3 settings' }));
    expect(onConfirm).toHaveBeenCalledWith(analysis.candidateConfig);
  });

  it('labels unknown instructions as unverified and links to published sources', () => {
    const analysis = analyzeGhosttyConfig(`
font-size = 16
future-option = "raw = value"
mouse-hide-while-typing = maybe
`);

    render(
      <ImportReviewDialog
        open
        fileName="config"
        fileSize={48}
        currentSettingCount={0}
        analysis={analysis}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const knownSource = screen.getByRole('link', { name: 'font-size' });
    expect(knownSource).toHaveAttribute(
      'href',
      'https://ghostty.org/docs/config/reference#font-size'
    );
    expect(knownSource).toHaveAttribute('target', '_blank');
    expect(knownSource).toHaveAttribute('rel', 'noopener noreferrer');
    expect(knownSource).toHaveAccessibleDescription('Opens in a new tab.');

    const unknownSource = screen.getByRole('link', { name: 'future-option' });
    expect(unknownSource).toHaveAttribute(
      'href',
      'https://ghostty.org/docs/config/reference'
    );
    expect(unknownSource).toHaveAttribute('target', '_blank');
    expect(unknownSource).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('Unverified')).toBeInTheDocument();

    const knownIssueSource = screen.getByRole('link', {
      name: 'Ghostty reference for mouse-hide-while-typing',
    });
    expect(knownIssueSource).toHaveAttribute(
      'href',
      'https://ghostty.org/docs/config/reference#mouse-hide-while-typing'
    );
    expect(knownIssueSource).toHaveAttribute('target', '_blank');
    expect(knownIssueSource).toHaveAttribute('rel', 'noopener noreferrer');

    const unknownIssueSource = screen.getByRole('link', {
      name: 'Ghostty reference for future-option',
    });
    expect(unknownIssueSource).toHaveAttribute(
      'href',
      'https://ghostty.org/docs/config/reference'
    );
    expect(unknownIssueSource).toHaveAttribute('target', '_blank');
    expect(unknownIssueSource).toHaveAttribute('rel', 'noopener noreferrer');

    const compatibilityPolicy = screen.getByRole('link', {
      name: 'Spectre compatibility policy',
    });
    expect(compatibilityPolicy).toHaveAttribute(
      'href',
      'https://github.com/imrajyavardhan12/spectre-ghostty-config/blob/main/COMPATIBILITY.md'
    );
    expect(compatibilityPolicy).toHaveAttribute('target', '_blank');
    expect(compatibilityPolicy).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows related source lines for repeated unknown options', () => {
    const analysis = analyzeGhosttyConfig(`
future-option = first
future-option = second
future-option = third
`);

    render(
      <ImportReviewDialog
        open
        fileName="config"
        fileSize={72}
        currentSettingCount={0}
        analysis={analysis}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.queryByText('future-option = first')).not.toBeInTheDocument();
    expect(screen.queryByText('future-option = second')).not.toBeInTheDocument();
    expectImportedInstruction('future-option', 'future-option = third');
    expectImportIssue(/Line 4.*Related lines: 2, 3\./);
  });

  it('shows invalid known values and explicit partial-import action copy', () => {
    const analysis = analyzeGhosttyConfig(`
font-size = 16
mouse-hide-while-typing = maybe
`);
    const onConfirm = vi.fn();

    render(
      <ImportReviewDialog
        open
        fileName="config"
        fileSize={48}
        currentSettingCount={2}
        analysis={analysis}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    expectImportedInstruction('font-size', 'font-size = 16');
    expectImportIssue(/Line 3.*Use 1, 0, t, T, f, F, true, or false\./);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Replace with 1 setting and skip 1 line',
      })
    );
    expect(onConfirm).toHaveBeenCalledWith({ 'font-size': 16 });
  });

  it('shows clamp warnings without counting retained values as skipped', () => {
    const analysis = analyzeGhosttyConfig('cursor-opacity = 2');

    render(
      <ImportReviewDialog
        open
        fileName="config"
        fileSize={18}
        currentSettingCount={0}
        analysis={analysis}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expectImportIssue(
      'Warning — Line 1 · cursor-opacity: Ghostty will clamp values above 1 down to 1.'
    );
    expect(
      screen.getByRole('button', { name: 'Replace with 1 setting' })
    ).toBeEnabled();
    expect(screen.queryByText(/skipped line/)).not.toBeInTheDocument();
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
    expectImportedInstruction(
      'cursor-style',
      'cursor-style = (reset to default)'
    );
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
