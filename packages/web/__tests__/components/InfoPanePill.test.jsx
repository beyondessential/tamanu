import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it } from 'vitest';
import { TruncatedPill } from '../../app/components/PatientInfoPane/InfoPanePill';
import { createStubTheme } from '../helpers';

const STATUS = 'Lost to follow up after transfer';

const renderPill = ({ scrollWidth, clientWidth }) => {
  render(
    <ThemeProvider theme={createStubTheme()}>
      <TruncatedPill data-testid="status-pill">{STATUS}</TruncatedPill>
    </ThemeProvider>,
  );
  const pill = screen.getByTestId('status-pill');
  Object.defineProperty(pill, 'scrollWidth', { configurable: true, value: scrollWidth });
  Object.defineProperty(pill, 'clientWidth', { configurable: true, value: clientWidth });
  return pill;
};

const wait = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

describe('TruncatedPill', () => {
  it('shows the full status in a tooltip when the pill is truncated', async () => {
    const pill = renderPill({ scrollWidth: 240, clientWidth: 140 });

    fireEvent.mouseOver(pill);

    expect((await screen.findByRole('tooltip')).textContent).toBe(STATUS);
  });

  it('shows no tooltip when the status fits', async () => {
    const pill = renderPill({ scrollWidth: 120, clientWidth: 120 });

    fireEvent.mouseOver(pill);
    await wait(400);

    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
