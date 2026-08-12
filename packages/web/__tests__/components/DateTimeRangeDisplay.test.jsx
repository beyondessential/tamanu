import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import {
  AuthContext,
  DateTimeProvider,
  DateTimeRangeDisplay,
  SettingsContext,
} from '@tamanu/ui-components';

const PRIMARY_TIME_ZONE = 'Pacific/Auckland';

const renderRange = ({ settings = {}, ...props }) =>
  render(
    <AuthContext.Provider value={{ primaryTimeZone: PRIMARY_TIME_ZONE }}>
      <SettingsContext.Provider value={{ getSetting: key => settings[key] }}>
        <DateTimeProvider>
          <div data-testid="range">
            <DateTimeRangeDisplay {...props} />
          </div>
        </DateTimeProvider>
      </SettingsContext.Provider>
    </AuthContext.Provider>,
  );

// The separator is a non-breaking space before the dash; normalise it so the
// expectations below read as the text a person sees.
const rangeText = () => screen.getByTestId('range').textContent.replace(/\u00a0/g, ' ');

describe('DateTimeRangeDisplay', () => {
  const settings = { dateTimeLocale: 'en-AU' };

  describe('without onDate', () => {
    it('shows one date for a range within a single day', () => {
      renderRange({
        settings,
        start: '2026-08-12 10:00:00',
        end: '2026-08-12 11:30:00',
      });
      expect(rangeText()).toBe('12/08/2026 10:00am – 11:30am');
    });

    it('shows both dates for a range spanning days', () => {
      renderRange({
        settings,
        start: '2026-08-12 10:00:00',
        end: '2026-08-14 11:30:00',
      });
      expect(rangeText()).toBe('12/08/2026 10:00am – 14/08/2026 11:30am');
    });

    it('shows the start alone when there is no end', () => {
      renderRange({ settings, start: '2026-08-12 10:00:00' });
      expect(rangeText()).toBe('12/08/2026 10:00am');
    });
  });

  describe('with onDate', () => {
    const start = '2026-08-12 10:00:00';
    const end = '2026-08-14 11:30:00';

    it('drops both dates when the range sits within the given day', () => {
      renderRange({
        settings,
        start,
        end: '2026-08-12 11:30:00',
        onDate: '2026-08-12',
        dateFormat: 'dayMonth',
      });
      expect(rangeText()).toBe('10:00am – 11:30am');
    });

    it('keeps only the end date on the first day of a span', () => {
      renderRange({ settings, start, end, onDate: '2026-08-12', dateFormat: 'dayMonth' });
      expect(rangeText()).toBe('10:00am – 14 Aug 11:30am');
    });

    it('keeps both dates on a day the range merely covers', () => {
      renderRange({ settings, start, end, onDate: '2026-08-13', dateFormat: 'dayMonth' });
      expect(rangeText()).toBe('12 Aug 10:00am – 14 Aug 11:30am');
    });

    it('keeps only the start date on the last day of a span', () => {
      renderRange({ settings, start, end, onDate: '2026-08-14', dateFormat: 'dayMonth' });
      expect(rangeText()).toBe('12 Aug 10:00am – 11:30am');
    });
  });

  describe('multi-day detection uses the display timezone', () => {
    // Values are stored in the primary timezone, Auckland (UTC+12 in August), and
    // read in Honolulu (UTC-10), 22 hours behind. So a stored day and a displayed
    // day are not the same day, in either direction.
    const settingsInHonolulu = { dateTimeLocale: 'en-AU', facilityTimeZone: 'Pacific/Honolulu' };

    it('treats a range as single-day when it stays within one day where it is read', () => {
      renderRange({
        settings: settingsInHonolulu,
        // 12 Aug 11:30pm → 13 Aug 12:30am stored: two days in Auckland,
        // but 1:30am → 2:30am on 12 Aug in Honolulu
        start: '2026-08-12 23:30:00',
        end: '2026-08-13 00:30:00',
      });
      expect(rangeText()).toBe('12/08/2026 1:30am – 2:30am');
    });

    it('treats a range as multi-day when it crosses midnight where it is read', () => {
      renderRange({
        settings: settingsInHonolulu,
        // 12 Aug 8:00am → 11:00pm stored: one day in Auckland, but
        // 11 Aug 10:00am → 12 Aug 1:00am in Honolulu
        start: '2026-08-12 08:00:00',
        end: '2026-08-12 23:00:00',
      });
      expect(rangeText()).toBe('11/08/2026 10:00am – 12/08/2026 1:00am');
    });

    it('decides onDate suppression against the display timezone too', () => {
      renderRange({
        settings: settingsInHonolulu,
        start: '2026-08-12 23:30:00',
        end: '2026-08-13 00:30:00',
        onDate: '2026-08-12',
      });
      expect(rangeText()).toBe('1:30am – 2:30am');
    });
  });

  describe('bidi isolation', () => {
    it('wraps each end so a right-to-left month cannot absorb the time beside it', () => {
      const { container } = renderRange({
        settings: { dateTimeLocale: 'ur-PK' },
        start: '2026-08-12 10:00:00',
        end: '2026-08-14 11:30:00',
        dateFormat: 'dayMonth',
      });
      const isolated = container.querySelectorAll('bdi');
      expect(isolated).toHaveLength(2);
      expect(isolated[0].textContent).toBe('12 اگست 10:00am');
      expect(isolated[1].textContent).toBe('14 اگست 11:30am');
    });
  });
});
