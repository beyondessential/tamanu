import { describe, expect, it } from 'vitest';

import { ADMINISTRATION_FREQUENCIES } from '@tamanu/constants';
import {
  findSubSlotIndex,
  getDosesPerSlot,
  getSubSlotDueAt,
  getSubSlots,
  mapRecordsToWindows,
} from '../../../../app/components/Medication/Mar/marTimeSlots';

describe('getDosesPerSlot', () => {
  it('returns 1 for immediate and as-directed', () => {
    expect(getDosesPerSlot(ADMINISTRATION_FREQUENCIES.IMMEDIATELY)).toBe(1);
    expect(getDosesPerSlot(ADMINISTRATION_FREQUENCIES.AS_DIRECTED)).toBe(1);
  });

  it('returns 1 for frequencies less than two-hourly', () => {
    const frequencies = [
      ADMINISTRATION_FREQUENCIES.EVERY_4_HOURS,
      ADMINISTRATION_FREQUENCIES.EVERY_6_HOURS,
      ADMINISTRATION_FREQUENCIES.EVERY_8_HOURS,
      ADMINISTRATION_FREQUENCIES.FOUR_TIMES_DAILY,
      ADMINISTRATION_FREQUENCIES.THREE_TIMES_DAILY,
      ADMINISTRATION_FREQUENCIES.TWICE_DAILY_AM_AND_MIDDAY,
      ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY,
      ADMINISTRATION_FREQUENCIES.DAILY_AT_NIGHT,
      ADMINISTRATION_FREQUENCIES.DAILY_AT_MIDDAY,
      ADMINISTRATION_FREQUENCIES.DAILY_IN_THE_MORNING,
      ADMINISTRATION_FREQUENCIES.DAILY,
      ADMINISTRATION_FREQUENCIES.EVERY_SECOND_DAY,
      ADMINISTRATION_FREQUENCIES.ONCE_A_WEEK,
      ADMINISTRATION_FREQUENCIES.ONCE_A_MONTH,
    ];
    for (const frequency of frequencies) expect(getDosesPerSlot(frequency)).toBe(1);
  });

  it('returns 2 for hourly', () => {
    expect(getDosesPerSlot(ADMINISTRATION_FREQUENCIES.HOURLY)).toBe(2);
  });

  it('returns 4 for half-hourly', () => {
    expect(getDosesPerSlot(ADMINISTRATION_FREQUENCIES.HALF_HOURLY)).toBe(4);
  });
});

describe('getSubSlots', () => {
  const window = { startTime: '06:00', endTime: '08:00', periodLabel: 'breakfast' };

  it('returns the parent window when dosesPerSlot is 1', () => {
    expect(getSubSlots(window, 1)).toEqual([{ startTime: '06:00', endTime: '08:00' }]);
  });

  it('splits a window into two hourly sub-slots', () => {
    expect(getSubSlots(window, 2)).toEqual([
      { startTime: '06:00', endTime: '07:00' },
      { startTime: '07:00', endTime: '08:00' },
    ]);
  });

  it('splits a window into four half-hourly sub-slots', () => {
    expect(getSubSlots(window, 4)).toEqual([
      { startTime: '06:00', endTime: '06:30' },
      { startTime: '06:30', endTime: '07:00' },
      { startTime: '07:00', endTime: '07:30' },
      { startTime: '07:30', endTime: '08:00' },
    ]);
  });

  it('preserves a 24:00 parent endTime on the last sub-slot', () => {
    const night = { startTime: '22:00', endTime: '24:00' };
    expect(getSubSlots(night, 2)).toEqual([
      { startTime: '22:00', endTime: '23:00' },
      { startTime: '23:00', endTime: '24:00' },
    ]);
  });
});

describe('findSubSlotIndex', () => {
  const subSlots = getSubSlots({ startTime: '06:00', endTime: '08:00' }, 4);

  it('maps each ideal time to its sub-slot', () => {
    expect(findSubSlotIndex('06:00', subSlots)).toBe(0);
    expect(findSubSlotIndex('06:30', subSlots)).toBe(1);
    expect(findSubSlotIndex('07:00', subSlots)).toBe(2);
    expect(findSubSlotIndex('07:30', subSlots)).toBe(3);
  });

  it('returns -1 when the time is outside the window', () => {
    expect(findSubSlotIndex('05:59', subSlots)).toBe(-1);
    expect(findSubSlotIndex('08:00', subSlots)).toBe(-1);
  });
});

describe('mapRecordsToWindows', () => {
  const identity = date => date; // already facility-local ISO

  it('places a single record into the matching 1-dose window', () => {
    const records = [{ id: 'a', dueAt: '2024-01-01T06:00:00' }];
    const windows = mapRecordsToWindows(records, identity, 1);
    expect(windows[3]).toEqual([{ id: 'a', dueAt: '2024-01-01T06:00:00' }]); // 06:00–08:00
    expect(windows[3]).toHaveLength(1);
  });

  it('places two hourly records into adjacent sub-slots of the same window', () => {
    const records = [
      { id: 'a', dueAt: '2024-01-01T06:00:00' },
      { id: 'b', dueAt: '2024-01-01T07:00:00' },
    ];
    const windows = mapRecordsToWindows(records, identity, 2);
    expect(windows[3]).toEqual([
      { id: 'a', dueAt: '2024-01-01T06:00:00' },
      { id: 'b', dueAt: '2024-01-01T07:00:00' },
    ]);
  });

  it('places four half-hourly records without overwriting', () => {
    const records = [
      { id: 'a', dueAt: '2024-01-01T06:00:00' },
      { id: 'b', dueAt: '2024-01-01T06:30:00' },
      { id: 'c', dueAt: '2024-01-01T07:00:00' },
      { id: 'd', dueAt: '2024-01-01T07:30:00' },
    ];
    const windows = mapRecordsToWindows(records, identity, 4);
    expect(windows[3].map(r => r?.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('leaves empty sub-slots as null', () => {
    const records = [{ id: 'a', dueAt: '2024-01-01T07:00:00' }];
    const windows = mapRecordsToWindows(records, identity, 2);
    expect(windows[3]).toEqual([null, { id: 'a', dueAt: '2024-01-01T07:00:00' }]);
  });
});

describe('getSubSlotDueAt', () => {
  it('returns the sub-slot start on the selected date', () => {
    const selectedDate = new Date(2024, 0, 15);
    const dueAt = getSubSlotDueAt({ startTime: '07:00', endTime: '08:00' }, selectedDate);
    expect(dueAt.getFullYear()).toBe(2024);
    expect(dueAt.getMonth()).toBe(0);
    expect(dueAt.getDate()).toBe(15);
    expect(dueAt.getHours()).toBe(7);
    expect(dueAt.getMinutes()).toBe(0);
  });
});
