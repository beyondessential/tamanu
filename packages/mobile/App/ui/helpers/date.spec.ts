import { formatDateForDisplay, formatStringDateForDisplay } from './date';
import { DateFormats } from './constants';

describe('formatStringDateForDisplay', () => {
  const dateOnly = '1990-05-15';
  const dateTime = '2024-04-12T15:30:00';

  it('formats DateFormats constants per the given locale', () => {
    expect(formatStringDateForDisplay(dateOnly, DateFormats.DDMMYY, 'en-GB')).toBe('15/05/1990');
    expect(formatStringDateForDisplay(dateOnly, DateFormats.DDMMYY, 'en-US')).toBe('05/15/1990');

    expect(formatStringDateForDisplay(dateOnly, DateFormats.DAY_MONTH_YEAR_SHORT, 'en-GB')).toBe(
      '15 May 1990',
    );
    expect(formatStringDateForDisplay(dateOnly, DateFormats.DAY_MONTH_YEAR_SHORT, 'en-US')).toBe(
      'May 15, 1990',
    );
  });

  it('composes combined date+time formats without a locale separator', () => {
    expect(formatStringDateForDisplay(dateTime, DateFormats.DATE_AND_TIME_HHMM, 'en-GB')).toBe(
      '12 Apr 2024 3:30 pm',
    );
    expect(formatStringDateForDisplay(dateTime, DateFormats.DDMMYY_HHMMSS, 'en-US')).toBe(
      '04/12/2024 3:30:00 PM',
    );
  });

  it('falls back to the runtime locale when none is given', () => {
    const runtimeDefault = Intl.DateTimeFormat().resolvedOptions().locale;
    expect(formatStringDateForDisplay(dateOnly, DateFormats.DDMMYY)).toBe(
      formatStringDateForDisplay(dateOnly, DateFormats.DDMMYY, runtimeDefault),
    );
  });

  it('returns an empty string for empty input', () => {
    expect(formatStringDateForDisplay('', DateFormats.DDMMYY, 'en-GB')).toBe('');
  });
});

describe('formatDateForDisplay', () => {
  it('leaves non-display format strings on locale-independent date-fns formatting', () => {
    const date = new Date(2024, 3, 12, 15, 30, 0);
    // ISO 9075 storage format must never become locale-dependent
    expect(formatDateForDisplay(date, 'yyyy-MM-dd HH:mm:ss', 'en-US')).toBe('2024-04-12 15:30:00');
  });
});
