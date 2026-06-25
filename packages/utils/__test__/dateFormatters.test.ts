import { describe, expect, it } from 'vitest';
import { formatShort, formatFullDate, formatShortDateTime } from '../src/dateFormatters';

const PRIMARY_TZ = 'Pacific/Auckland';

describe('dateFormatters locale handling', () => {
  const storedDateTime = '2024-04-12 15:30:00';

  it('formats day/month order according to the given locale', () => {
    expect(formatShort(storedDateTime, PRIMARY_TZ, null, 'en-GB')).toBe('12/04/2024');
    expect(formatShort(storedDateTime, PRIMARY_TZ, null, 'en-US')).toBe('04/12/2024');
  });

  it('formats full dates according to the given locale', () => {
    expect(formatFullDate(storedDateTime, PRIMARY_TZ, null, 'en-GB')).toBe('12 April 2024');
    expect(formatFullDate(storedDateTime, PRIMARY_TZ, null, 'en-US')).toBe('April 12, 2024');
  });

  it('threads the locale through compound formatters', () => {
    expect(formatShortDateTime(storedDateTime, PRIMARY_TZ, null, 'en-GB')).toBe(
      '12/04/2024 03:30pm',
    );
    expect(formatShortDateTime(storedDateTime, PRIMARY_TZ, null, 'en-US')).toBe(
      '04/12/2024 3:30pm',
    );
  });

  it('falls back to the runtime locale when none is given', () => {
    const runtimeDefault = Intl.DateTimeFormat().resolvedOptions().locale;
    expect(formatShort(storedDateTime, PRIMARY_TZ)).toBe(
      formatShort(storedDateTime, PRIMARY_TZ, null, runtimeDefault),
    );
  });
});
