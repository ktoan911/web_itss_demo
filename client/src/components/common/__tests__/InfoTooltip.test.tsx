import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InfoTooltip } from '../InfoTooltip';

describe('InfoTooltip', () => {
  it('exposes its text via accessible label', () => {
    render(<InfoTooltip text="Helpful hint" />);
    expect(screen.getByLabelText('Helpful hint')).toBeInTheDocument();
  });

  it('reveals the tooltip text on focus', () => {
    render(<InfoTooltip text="Helpful hint" />);
    const btn = screen.getByLabelText('Helpful hint');
    fireEvent.focus(btn);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful hint');
  });
});
