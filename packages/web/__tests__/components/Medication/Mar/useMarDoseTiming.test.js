import { describe, expect, it } from 'vitest';

import {
  getIsCurrent,
  getIsNotDue,
  getIsPast,
} from '../../../../app/components/Medication/Mar/useMarDoseTiming';

describe('getIsNotDue', () => {
  const selectedDate = new Date(2026, 6, 23);

  it('is false for the current hourly sub-slot mid parent window', () => {
    const now = new Date(2026, 6, 23, 14, 30);
    expect(
      getIsNotDue({
        timeSlot: { startTime: '14:00', endTime: '15:00' },
        selectedDate,
        now,
      }),
    ).toBe(false);
  });

  it('is true for a later hourly sub-slot in the same parent window', () => {
    const now = new Date(2026, 6, 23, 14, 30);
    expect(
      getIsNotDue({
        timeSlot: { startTime: '15:00', endTime: '16:00' },
        selectedDate,
        now,
      }),
    ).toBe(true);
  });

  it('is true for a far-future sub-slot', () => {
    const now = new Date(2026, 6, 23, 14, 30);
    expect(
      getIsNotDue({
        timeSlot: { startTime: '20:00', endTime: '21:00' },
        selectedDate,
        now,
      }),
    ).toBe(true);
  });

  it('does not use a +2h lookahead when a record would previously have delayed not-due', () => {
    // Previously: with hasRecord, start within now+2h stayed "due". Now start > now is enough.
    const now = new Date(2026, 6, 23, 14, 30);
    expect(
      getIsNotDue({
        timeSlot: { startTime: '15:30', endTime: '16:00' },
        selectedDate,
        now,
      }),
    ).toBe(true);
  });
});

describe('getIsPast / getIsCurrent for hourly sub-slots', () => {
  const selectedDate = new Date(2026, 6, 23);
  const first = { startTime: '14:00', endTime: '15:00' };
  const second = { startTime: '15:00', endTime: '16:00' };

  it('marks the first sub-slot past after it ends, and the second current', () => {
    const now = new Date(2026, 6, 23, 15, 15);

    expect(getIsPast({ timeSlot: first, selectedDate, now })).toBe(true);
    expect(getIsCurrent({ timeSlot: first, selectedDate, now })).toBe(false);
    expect(getIsNotDue({ timeSlot: first, selectedDate, now })).toBe(false);

    expect(getIsPast({ timeSlot: second, selectedDate, now })).toBe(false);
    expect(getIsCurrent({ timeSlot: second, selectedDate, now })).toBe(true);
    expect(getIsNotDue({ timeSlot: second, selectedDate, now })).toBe(false);
  });

  it('marks neither past when still in the first sub-slot', () => {
    const now = new Date(2026, 6, 23, 14, 30);

    expect(getIsPast({ timeSlot: first, selectedDate, now })).toBe(false);
    expect(getIsCurrent({ timeSlot: first, selectedDate, now })).toBe(true);

    expect(getIsPast({ timeSlot: second, selectedDate, now })).toBe(false);
    expect(getIsCurrent({ timeSlot: second, selectedDate, now })).toBe(false);
  });
});
