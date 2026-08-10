import { describe, expect, it } from 'vitest';

import { ADMINISTRATION_STATUS } from '@tamanu/constants';
import getShowDoseInfo, {
  getMarStatusIconVariant,
  hasVisibleMarStatusIcon,
} from '../../../../app/components/Medication/Mar/getShowDoseInfo';

const base = {
  isDiscontinued: false,
  isEnd: false,
  isPast: false,
  isPaused: false,
  isPrn: false,
  showPending: false,
};

describe('hasVisibleMarStatusIcon', () => {

  it('is false when there is no marInfo', () => {
    expect(hasVisibleMarStatusIcon({ ...base, marInfo: null })).toBe(false);
  });

  it('is false for an empty due dose (no status, not past)', () => {
    expect(
      hasVisibleMarStatusIcon({
        ...base,
        marInfo: { id: '1' },
      }),
    ).toBe(false);
  });

  it('is true for given and not-given', () => {
    expect(
      hasVisibleMarStatusIcon({
        ...base,
        marInfo: { id: '1', status: ADMINISTRATION_STATUS.GIVEN },
      }),
    ).toBe(true);
    expect(
      hasVisibleMarStatusIcon({
        ...base,
        marInfo: { id: '1', status: ADMINISTRATION_STATUS.NOT_GIVEN },
      }),
    ).toBe(true);
  });

  it('is true for missed (past, no status, not PRN)', () => {
    expect(
      hasVisibleMarStatusIcon({
        ...base,
        isPast: true,
        marInfo: { id: '1' },
      }),
    ).toBe(true);
  });

  it('is false for past PRN with no status (no missed icon)', () => {
    expect(
      hasVisibleMarStatusIcon({
        ...base,
        isPast: true,
        isPrn: true,
        marInfo: { id: '1' },
      }),
    ).toBe(false);
  });

  it('is false when ended, discontinued, or paused without status', () => {
    expect(
      hasVisibleMarStatusIcon({
        ...base,
        isEnd: true,
        marInfo: { id: '1' },
      }),
    ).toBe(false);
    expect(
      hasVisibleMarStatusIcon({
        ...base,
        isDiscontinued: true,
        marInfo: { id: '1' },
      }),
    ).toBe(false);
    expect(
      hasVisibleMarStatusIcon({
        ...base,
        isPaused: true,
        marInfo: { id: '1' },
      }),
    ).toBe(false);
  });

  it('is true for a pending dose in a sub-divided current-time cell', () => {
    expect(
      hasVisibleMarStatusIcon({
        ...base,
        showPending: true,
        marInfo: { id: '1' },
      }),
    ).toBe(true);
  });
});

describe('getMarStatusIconVariant', () => {
  it('returns the recorded status', () => {
    expect(
      getMarStatusIconVariant({
        ...base,
        marInfo: { id: '1', status: ADMINISTRATION_STATUS.GIVEN },
      }),
    ).toBe(ADMINISTRATION_STATUS.GIVEN);
    expect(
      getMarStatusIconVariant({
        ...base,
        marInfo: { id: '1', status: ADMINISTRATION_STATUS.NOT_GIVEN },
      }),
    ).toBe(ADMINISTRATION_STATUS.NOT_GIVEN);
  });

  it('returns missed for a past dose with no status', () => {
    expect(getMarStatusIconVariant({ ...base, isPast: true, marInfo: { id: '1' } })).toBe('missed');
  });

  it('returns pending only when the cell shows pending doses', () => {
    expect(getMarStatusIconVariant({ ...base, marInfo: { id: '1' } })).toBe(null);
    expect(getMarStatusIconVariant({ ...base, showPending: true, marInfo: { id: '1' } })).toBe(
      'pending',
    );
  });

  it('prefers a recorded status over pending', () => {
    expect(
      getMarStatusIconVariant({
        ...base,
        showPending: true,
        marInfo: { id: '1', status: ADMINISTRATION_STATUS.GIVEN },
      }),
    ).toBe(ADMINISTRATION_STATUS.GIVEN);
  });

  it('prefers missed over pending for a past sub-slot', () => {
    expect(
      getMarStatusIconVariant({
        ...base,
        isPast: true,
        showPending: true,
        marInfo: { id: '1' },
      }),
    ).toBe('missed');
  });

  it('returns no icon for a past PRN dose, even when pending doses are shown', () => {
    expect(
      getMarStatusIconVariant({
        ...base,
        isPast: true,
        isPrn: true,
        showPending: true,
        marInfo: { id: '1' },
      }),
    ).toBe(null);
  });

  it('returns no icon for inactive doses, even when pending doses are shown', () => {
    for (const flag of ['isEnd', 'isDiscontinued', 'isPaused']) {
      expect(
        getMarStatusIconVariant({
          ...base,
          [flag]: true,
          showPending: true,
          marInfo: { id: '1' },
        }),
      ).toBe(null);
    }
  });

  it('returns no icon when there is no dose record', () => {
    expect(getMarStatusIconVariant({ ...base, showPending: true, marInfo: null })).toBe(null);
  });
});

describe('getShowDoseInfo', () => {
  const selectedDate = new Date(2026, 6, 23);
  const timeSlot = { startTime: '14:00', endTime: '15:00' };
  const identity = date => date;
  const toMs = date => (date ? new Date(date).getTime() : null);

  const baseArgs = {
    medication: { dosingUnit: 'mg', doseAmount: 5 },
    timeSlot,
    selectedDate,
    nextMarInfo: null,
    pauseRecords: { data: [] },
    now: new Date(2026, 6, 23, 14, 30),
    toFacilityDateTime: identity,
    storedDateTimeToEpochMilliseconds: toMs,
  };

  it('is true for a due dose with marInfo and no status', () => {
    expect(
      getShowDoseInfo({
        ...baseArgs,
        marInfo: { id: '1', dueAt: '2026-07-23 14:00:00' },
      }),
    ).toBe(true);
  });

  it('is false once status is recorded', () => {
    expect(
      getShowDoseInfo({
        ...baseArgs,
        marInfo: {
          id: '1',
          dueAt: '2026-07-23 14:00:00',
          status: ADMINISTRATION_STATUS.GIVEN,
        },
      }),
    ).toBe(false);
  });

  it('is false when the sub-slot is past', () => {
    expect(
      getShowDoseInfo({
        ...baseArgs,
        now: new Date(2026, 6, 23, 15, 30),
        marInfo: { id: '1', dueAt: '2026-07-23 14:00:00' },
      }),
    ).toBe(false);
  });
});

describe('multi-slot overlay hide signal', () => {
  it('hides when any sub-slot has a visible status icon', () => {
    const subSlots = [
      { marInfo: { id: '1', status: ADMINISTRATION_STATUS.GIVEN }, isPast: false },
      { marInfo: { id: '2' }, isPast: false },
    ];
    const anyStatusIcon = subSlots.some(({ marInfo, isPast }) =>
      hasVisibleMarStatusIcon({
        marInfo,
        isDiscontinued: false,
        isEnd: false,
        isPast,
        isPaused: false,
        isPrn: false,
      }),
    );
    expect(anyStatusIcon).toBe(true);
  });

  it('stays visible when all sub-slots are empty', () => {
    const subSlots = [
      { marInfo: { id: '1' }, isPast: false },
      { marInfo: { id: '2' }, isPast: false },
    ];
    const anyStatusIcon = subSlots.some(({ marInfo, isPast }) =>
      hasVisibleMarStatusIcon({
        marInfo,
        isDiscontinued: false,
        isEnd: false,
        isPast,
        isPaused: false,
        isPrn: false,
      }),
    );
    expect(anyStatusIcon).toBe(false);
  });

  it('hides when a sub-slot is missed', () => {
    const anyStatusIcon = hasVisibleMarStatusIcon({
      marInfo: { id: '1' },
      isDiscontinued: false,
      isEnd: false,
      isPast: true,
      isPaused: false,
      isPrn: false,
    });
    expect(anyStatusIcon).toBe(true);
  });

  it('hides in the current window, where empty sub-slots show a pending icon', () => {
    const subSlots = [
      { marInfo: { id: '1' }, isPast: true },
      { marInfo: { id: '2' }, isPast: false },
    ];
    const anyStatusIcon = subSlots.some(({ marInfo, isPast }) =>
      hasVisibleMarStatusIcon({
        marInfo,
        isDiscontinued: false,
        isEnd: false,
        isPast,
        isPaused: false,
        isPrn: false,
        showPending: true,
      }),
    );
    expect(anyStatusIcon).toBe(true);
  });
});
