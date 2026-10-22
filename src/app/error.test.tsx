import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ErrorPage from './error';
import NotFound from './not-found';

describe('ErrorPage', () => {
  it('retries from the Try again button and shows the error id with a report link', () => {
    const reset = vi.fn();
    render(<ErrorPage error={Object.assign(new Error('boom'), { digest: 'e3b0c442' })} reset={reset} />);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText('e3b0c442')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Report on GitHub' })).toHaveAttribute(
      'href',
      expect.stringContaining('title=Error%20e3b0c442')
    );
  });

  it('still offers a report link without an error id, and never prints the error message', () => {
    render(<ErrorPage error={new Error('secret internal detail')} reset={() => {}} />);

    expect(screen.queryByText(/Error ID/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Report on GitHub' })).toBeInTheDocument();
    expect(screen.queryByText(/secret internal detail/)).not.toBeInTheDocument();
  });
});

describe('NotFound', () => {
  it('names the miss and links to the editor and home', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: 'Nothing at this path' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Open editor' }).every((link) => link.getAttribute('href') === '/editor')).toBe(true);
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
  });
});
