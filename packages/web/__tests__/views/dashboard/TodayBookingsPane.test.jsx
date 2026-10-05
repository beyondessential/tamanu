import * as React from 'react';
import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APPOINTMENT_STATUSES } from '@tamanu/constants';
import { AuthContext, DateTimeProvider, SettingsContext } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../helpers/render';

// The booking from the reported bug: 12 Aug 10:00am through to 14 Aug 11:30am.
const OVERNIGHT_BOOKING = {
  id: 'booking-overnight',
  startTime: '2026-08-12 10:00:00',
  endTime: '2026-08-14 11:30:00',
  status: APPOINTMENT_STATUSES.ARRIVED,
  patient: { firstName: 'Barton', lastName: 'Aufderhar' },
  location: { name: 'Outpatient', locationGroup: { name: 'Outpatient' } },
};

const SAME_DAY_BOOKING = {
  id: 'booking-same-day',
  startTime: '2026-08-12 08:30:00',
  endTime: '2026-08-12 09:00:00',
  status: APPOINTMENT_STATUSES.SEEN,
  patient: { firstName: 'Marisol', lastName: 'Frami' },
  location: { name: 'Bed 2', locationGroup: { name: 'Ward 1' } },
};

const { bookings } = vi.hoisted(() => ({ bookings: { value: [] } }));

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ currentUser: { id: 'user-1' }, facilityId: 'facility-1' }),
}));

vi.mock('../../../app/api/queries/useAutoUpdatingQuery', () => ({
  useAutoUpdatingQuery: () => ({ data: { data: bookings.value } }),
}));

vi.mock('../../../app/api/mutations', () => ({
  useUserPreferencesMutation: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('react-router', async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => vi.fn() };
});

import { TodayBookingsPane } from '../../../app/views/dashboard/components/TodayBookingsPane';

const PRIMARY_TIME_ZONE = 'Pacific/Auckland';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/**
 * Drives "today" through the real clock rather than a stubbed `useDateTime`, so the
 * date the pane compares against is the one the provider actually derives. 6:00 UTC
 * is mid-evening in Auckland, well inside the intended day.
 */
const renderPane = ({ onDate, withBookings }) => {
  vi.setSystemTime(new Date(`${onDate}T06:00:00Z`));
  bookings.value = withBookings;
  return renderElementWithTranslatedText(
    <AuthContext.Provider value={{ primaryTimeZone: PRIMARY_TIME_ZONE }}>
      <SettingsContext.Provider value={{ getSetting: key => ({ dateTimeLocale: 'en-AU' })[key] }}>
        <DateTimeProvider>
          <TodayBookingsPane />
        </DateTimeProvider>
      </SettingsContext.Provider>
    </AuthContext.Provider>,
  );
};

/** A row's lines, with the non-breaking space before the dash normalised. */
const rowLines = () =>
  [...document.querySelectorAll('[data-testid^="rangeline-"]')].map(line =>
    line.textContent.replace(/\u00a0/g, ' '),
  );

describe('TodayBookingsPane overnight bookings', () => {
  it('carries the end date on the first day, and leaves a same-day row alone', () => {
    // Rows arrive sorted by start time, so on 12 Aug the 8:30am booking comes first
    renderPane({ onDate: '2026-08-12', withBookings: [SAME_DAY_BOOKING, OVERNIGHT_BOOKING] });
    expect(rowLines()).toEqual([
      '8:30am – 9:00am', // one line, exactly as it renders today
      '10:00am –',
      '14 Aug 11:30am',
    ]);
  });

  it('carries both dates on a day the stay merely covers', () => {
    renderPane({ onDate: '2026-08-13', withBookings: [OVERNIGHT_BOOKING] });
    expect(rowLines()).toEqual(['12 Aug 10:00am –', '14 Aug 11:30am']);
  });

  it('carries the start date on the last day of the stay', () => {
    renderPane({ onDate: '2026-08-14', withBookings: [OVERNIGHT_BOOKING] });
    expect(rowLines()).toEqual(['12 Aug 10:00am –', '11:30am']);
  });

  it('never shows the two times as though they were the same day', () => {
    for (const onDate of ['2026-08-12', '2026-08-13', '2026-08-14']) {
      const { unmount } = renderPane({ onDate, withBookings: [OVERNIGHT_BOOKING] });
      expect(rowLines().join(' ')).not.toBe('10:00am – 11:30am');
      unmount();
    }
  });

  it('marks a booking spanning days with the overnight indicator', () => {
    renderPane({ onDate: '2026-08-13', withBookings: [OVERNIGHT_BOOKING] });
    expect(screen.getByTestId('overnighticon-p8ka')).toBeTruthy();
  });

  it('leaves a booking wholly within today unmarked, and on one line', () => {
    renderPane({ onDate: '2026-08-12', withBookings: [SAME_DAY_BOOKING] });
    expect(screen.queryByTestId('overnighticon-p8ka')).toBeNull();
    expect(rowLines()).toEqual(['8:30am – 9:00am']);
  });

  it('shows a booking with no end time as a single time', () => {
    renderPane({
      onDate: '2026-08-12',
      withBookings: [{ ...SAME_DAY_BOOKING, endTime: null }],
    });
    expect(rowLines()).toEqual(['8:30am']);
    expect(screen.queryByTestId('overnighticon-p8ka')).toBeNull();
  });
});
