// Set before any date-fns/appointmentScheduling imports: date-fns reads the runtime TZ, and a
// date-only string parsed via `new Date(...)` is UTC midnight, which lands on the previous local
// day in a UTC-negative timezone.
process.env.TZ = 'America/Santiago';

import { describe, test, expect } from 'vitest';
import { REPEAT_FREQUENCY } from '@tamanu/constants';
import { getNextFrequencyDate } from '../src/appointmentScheduling';

describe('getNextFrequencyDate', () => {
  test('keeps the same ordinal weekday position for monthly repeats in a UTC-negative timezone', () => {
    // 2024-03-08 is the 2nd Friday of March 2024, so the next monthly repeat should land on the
    // 2nd Friday of April 2024, which is 2024-04-12.
    const nextDate = getNextFrequencyDate('2024-03-08', 1, REPEAT_FREQUENCY.MONTHLY);

    expect(nextDate).toBe('2024-04-12');
  });
});
