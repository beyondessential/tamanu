import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { DateTimeSelector } from '../../../app/components/Charts/components/DateTimeSelector';

const CURRENT_DATE_TIME = '2026-07-13 12:00:00';

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useDateTime: () => ({ getCurrentDateTime: () => CURRENT_DATE_TIME }),
    // Stub out the react-select based input so options can be listed and
    // selected through a native select element.
    SelectInput: ({ options, value, onChange }) => (
      <select
        data-testid="range-select"
        value={value}
        onChange={event => onChange({ target: { value: event.target.value } })}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.value}
          </option>
        ))}
      </select>
    ),
    DateInput: () => null,
  };
});

describe('DateTimeSelector', () => {
  let setDateRange;

  beforeEach(() => {
    setDateRange = vi.fn();
  });

  const renderSelector = props =>
    render(
      <DateTimeSelector dateRange={['', '']} setDateRange={setDateRange} {...props} />,
    );

  const getRenderedOptionValues = () =>
    Array.from(screen.getByTestId('range-select').options).map(option => option.value);

  const selectRange = value =>
    fireEvent.change(screen.getByTestId('range-select'), { target: { value } });

  it('lists ranges from smallest to largest with custom date last', () => {
    renderSelector();

    expect(getRenderedOptionValues()).toEqual([
      'Last 24 hours',
      'Last 48 hours',
      'Last 7 days',
      'Last 30 days',
      'Custom Date',
    ]);
  });

  it('includes the last year range for program registry', () => {
    renderSelector({ showProgramRegistryOptions: true });

    expect(getRenderedOptionValues()).toEqual([
      'Last 24 hours',
      'Last 48 hours',
      'Last 7 days',
      'Last 30 days',
      'Last year',
      'Custom Date',
    ]);
  });

  it('defaults to the last 24 hours ending at the current time', () => {
    renderSelector();

    expect(setDateRange).toHaveBeenLastCalledWith(['2026-07-12 12:00:00', CURRENT_DATE_TIME]);
  });

  it('sets a 7-day range ending at the current time', () => {
    renderSelector();
    selectRange('Last 7 days');

    expect(setDateRange).toHaveBeenLastCalledWith(['2026-07-06 12:00:00', CURRENT_DATE_TIME]);
  });

  it('sets a 30-day range ending at the current time', () => {
    renderSelector();
    selectRange('Last 30 days');

    expect(setDateRange).toHaveBeenLastCalledWith(['2026-06-13 12:00:00', CURRENT_DATE_TIME]);
  });

  it('sets a 1-year range ending at the current time', () => {
    renderSelector({ showProgramRegistryOptions: true });
    selectRange('Last year');

    expect(setDateRange).toHaveBeenLastCalledWith(['2025-07-13 12:00:00', CURRENT_DATE_TIME]);
  });
});
