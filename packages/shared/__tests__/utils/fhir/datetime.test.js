import __cjs_date_fns_tz from 'date-fns-tz';

import { dateParts } from '../../../src/utils/fhir/datetime';

const { getTimezoneOffset } = __cjs_date_fns_tz;

describe('dateParts', () => {
  it('preserves the supplied timezone when the datetime string has no explicit offset', () => {
    // Pacific/Kiritimati has a fixed +14:00 offset with no daylight saving,
    // so the expected tz is deterministic regardless of the date used.
    const withTz = 'Pacific/Kiritimati';
    const combinedDate = new Date('2024-01-15T10:00:00');
    const str = '2024-01-15T10:00:00';
    const form = "yyyy-MM-dd'T'HH:mm:ss";

    const result = dateParts(combinedDate, withTz, str, form);

    const expectedOffsetSeconds = getTimezoneOffset(withTz, result.plain) / 1000;
    expect(expectedOffsetSeconds).toBe(14 * 3600);
    expect(result.tz).toBe('+14:00');
  });
});
