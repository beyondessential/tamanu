import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LimitedLinesCell } from '../../app/components/FormattedTableCell';

const CLINICIAN_NAME = 'Dr Bartholomew Featherstonehaugh-Cholmondeley';

// jsdom has no layout engine, so simulate truncation by stubbing the
// dimensions LimitedLinesCell compares to decide whether content is clamped
const stubContentDimensions = ({ scrollWidth, clientWidth }) => {
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    value: scrollWidth,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    value: clientWidth,
  });
};

// As used for the clinician column in TriageTable
const renderCell = () =>
  render(<LimitedLinesCell value={CLINICIAN_NAME} isOneLine maxWidth="100px" />);

describe('LimitedLinesCell', () => {
  afterEach(() => {
    delete HTMLElement.prototype.scrollWidth;
    delete HTMLElement.prototype.clientWidth;
  });

  it('shows a tooltip with the full value when the content is truncated', async () => {
    stubContentDimensions({ scrollWidth: 300, clientWidth: 100 });
    renderCell();

    fireEvent.mouseOver(screen.getByTestId('limitedlinescellwrapper-imvw'));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.textContent).toBe(CLINICIAN_NAME);
  });

  it('does not show a tooltip when the content fits', () => {
    stubContentDimensions({ scrollWidth: 100, clientWidth: 100 });
    renderCell();

    fireEvent.mouseOver(screen.getByTestId('limitedlinescellwrapper-imvw'));

    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
