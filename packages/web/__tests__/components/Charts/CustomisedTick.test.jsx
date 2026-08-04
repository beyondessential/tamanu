import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getTime } from 'date-fns';
import { AuthContext, DateTimeProvider, SettingsContext } from '@tamanu/ui-components';

import { CustomisedXAxisTick } from '../../../app/components/Charts/components/CustomisedTick';

const PRIMARY_TIME_ZONE = 'Pacific/Auckland';
// A Monday, so the weekday-abbreviation variant has an unambiguous expectation.
const TICK_DATE_TIME = '2026-05-18 15:30:00';

const renderTick = variant =>
  render(
    <AuthContext.Provider value={{ primaryTimeZone: PRIMARY_TIME_ZONE }}>
      <SettingsContext.Provider value={{ getSetting: () => undefined }}>
        <DateTimeProvider primaryTimeZone={PRIMARY_TIME_ZONE} dateTimeLocale="en-GB">
          <svg>
            <CustomisedXAxisTick
              x={0}
              y={0}
              variant={variant}
              payload={{ value: getTime(new Date(TICK_DATE_TIME)) }}
            />
          </svg>
        </DateTimeProvider>
      </SettingsContext.Provider>
    </AuthContext.Provider>,
  );

describe('CustomisedXAxisTick', () => {
  it('shows the date and time for the "time" variant (24h/48h/custom ranges)', () => {
    renderTick('time');

    expect(screen.getByTestId('text-ch4x').textContent).toBe('18/05/26');
    expect(screen.getByTestId('text-cydx').textContent).toBe('03:30pm');
  });

  it('shows the date and abbreviated weekday for the "weekday" variant (7-day range)', () => {
    renderTick('weekday');

    expect(screen.getByTestId('text-ch4x').textContent).toBe('18/05/26');
    expect(screen.getByTestId('text-cydx').textContent).toBe('Mon');
  });

  it('shows a single "day month \'year" line for the "dayMonthYear" variant (30-day range)', () => {
    renderTick('dayMonthYear');

    expect(screen.getByTestId('text-ch4x').textContent).toBe("18 May '26");
    expect(screen.queryByTestId('text-cydx')).toBeNull();
  });

  it('shows a single "month \'year" line for the "monthYear" variant (1-year range)', () => {
    renderTick('monthYear');

    expect(screen.getByTestId('text-ch4x').textContent).toBe("May '26");
    expect(screen.queryByTestId('text-cydx')).toBeNull();
  });
});
