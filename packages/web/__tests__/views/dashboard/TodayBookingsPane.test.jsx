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
const renderPane = ({ onDate, withBookings, at, facilityTimeZone }) => {
  vi.setSystemTime(new Date(at ?? `${onDate}T06:00:00Z`));
  bookings.value = withBookings;
  return renderElementWithTranslatedText(
    <AuthContext.Provider value={{ primaryTimeZone: PRIMARY_TIME_ZONE }}>
      {/* The facility timezone reaches the provider as a setting, the same way it does
          in the app — passing it through auth is silently ignored. */}
      <SettingsContext.Provider
        value={{ getSetting: key => ({ dateTimeLocale: 'en-AU', facilityTimeZone })[key] }}
      >
        <DateTimeProvider>
          <TodayBookingsPane />
        </DateTimeProvider>
      </SettingsContext.Provider>
    </AuthContext.Provider>,
  );
};

/** Each row's range as one string, with the non-breaking space before the dash normalised. */
const ranges = () =>
  [...document.querySelectorAll('[data-testid="rangetext-4k7e"]')].map(range =>
    range.textContent.replace(/\u00a0/g, ' '),
  );

describe('TodayBookingsPane booking ranges', () => {
  /* The pane is a snapshot of one day, so each end says only what the reader does not
     already know: a time for an end falling on the day being listed, a date for any
     other. A date at either end is then itself what says the booking reaches beyond
     today. */
  it('gives an end on the day being listed as a time, and any other end as a date', () => {
    // Rows arrive sorted by start time, so on 12 Aug the 8:30am booking comes first
    renderPane({ onDate: '2026-08-12', withBookings: [SAME_DAY_BOOKING, OVERNIGHT_BOOKING] });
    expect(ranges()).toEqual([
      '8:30am – 9:00am', // both ends fall today
      '10:00am – 14 Aug', // starts today, ends later
    ]);
  });

  it('gives both ends as dates on a day the stay merely covers', () => {
    renderPane({ onDate: '2026-08-13', withBookings: [OVERNIGHT_BOOKING] });
    expect(ranges()).toEqual(['12 Aug – 14 Aug']);
  });

  it('gives the end as a time on the last day of the stay', () => {
    renderPane({ onDate: '2026-08-14', withBookings: [OVERNIGHT_BOOKING] });
    expect(ranges()).toEqual(['12 Aug – 11:30am']);
  });

  /* Each day of the stay states the span differently, but no day of it ambiguously:
     the misreading being guarded against is the stay looking like a booking that both
     began and ended today. */
  it('never states a multi-day stay as though it began and ended today', () => {
    for (const onDate of ['2026-08-12', '2026-08-13', '2026-08-14']) {
      const { unmount } = renderPane({ onDate, withBookings: [OVERNIGHT_BOOKING] });
      expect(ranges()).toEqual([expect.stringContaining('Aug')]);
      expect(ranges()[0]).not.toBe('10:00am – 11:30am');
      unmount();
    }
  });

  /* The whole rule turns on comparing days as the reader sees them, not as they are
     stored, and that half is only exercised when the two timezones disagree about the
     date. Auckland (UTC+12) and Honolulu (UTC-10) are 22 hours apart, so a booking
     stored as 12 Aug 10:00am in the primary zone is 11 Aug 12:00pm where it is read,
     and 11 Aug is the reader's today. Comparing in the stored zone would make both ends
     look like another day and render "12 Aug – 12 Aug". */
  it('decides each end against the day the reader sees, not the day it is stored on', () => {
    renderPane({
      at: '2026-08-11T22:00:00Z',
      facilityTimeZone: 'Pacific/Honolulu',
      withBookings: [
        { ...SAME_DAY_BOOKING, startTime: '2026-08-12 10:00:00', endTime: '2026-08-12 11:00:00' },
      ],
    });
    expect(ranges()).toEqual(['12:00pm – 1:00pm']);
  });

  it('shows a booking with no end time as a single time', () => {
    renderPane({
      onDate: '2026-08-12',
      withBookings: [{ ...SAME_DAY_BOOKING, endTime: null }],
    });
    expect(ranges()).toEqual(['8:30am']);
  });

  /* Queried by the status it announces rather than by a test id: the shared indicator
     pins its own `data-testid` after spreading props, so the one this pane passes it
     never reaches the DOM. */
  it('marks every booking with an indicator of its status', () => {
    renderPane({ onDate: '2026-08-12', withBookings: [SAME_DAY_BOOKING, OVERNIGHT_BOOKING] });
    expect(screen.getByLabelText(APPOINTMENT_STATUSES.SEEN)).toBeTruthy();
    expect(screen.getByLabelText(APPOINTMENT_STATUSES.ARRIVED)).toBeTruthy();
  });

  /* The rail threads the indicators together. Where it starts and stops — including
     not being drawn at all for a lone booking — is left to CSS, which this renderer
     does not apply, so it is covered by the card's visual test cases instead. An
     assertion here on the rail element's presence would hold either way and so would
     prove nothing. */
  it('gives every booking a rail cell to thread the indicators through', () => {
    const { unmount } = renderPane({ onDate: '2026-08-12', withBookings: [SAME_DAY_BOOKING] });
    expect(screen.getAllByTestId('rail-3nqa')).toHaveLength(1);
    unmount();

    renderPane({ onDate: '2026-08-12', withBookings: [SAME_DAY_BOOKING, OVERNIGHT_BOOKING] });
    expect(screen.getAllByTestId('rail-3nqa')).toHaveLength(2);
  });
});
