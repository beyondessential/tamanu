import { set } from 'date-fns';

import {
  ADMINISTRATION_FREQUENCIES,
  MEDICATION_ADMINISTRATION_TIME_SLOTS,
  MEDICATION_DURATION_UNITS,
} from '@tamanu/constants';
import {
  findAdministrationTimeSlotFromIdealTime,
  getAutocalculatedDispensingQuantity,
} from '../../src/utils/medication';

const breakfastSlot = MEDICATION_ADMINISTRATION_TIME_SLOTS.find(s => s.startTime === '06:00');
const breakfastSlotIndex = MEDICATION_ADMINISTRATION_TIME_SLOTS.indexOf(breakfastSlot);

const morningSlot = MEDICATION_ADMINISTRATION_TIME_SLOTS.find(s => s.startTime === '08:00');
const morningSlotIndex = MEDICATION_ADMINISTRATION_TIME_SLOTS.indexOf(morningSlot);

const nightSlot = MEDICATION_ADMINISTRATION_TIME_SLOTS.find(s => s.startTime === '22:00');
const nightSlotIndex = MEDICATION_ADMINISTRATION_TIME_SLOTS.indexOf(nightSlot);

describe('findAdministrationTimeSlotFromIdealTime', () => {
  describe('breakfast slot (06:00–08:00)', () => {
    it('matches the start of the time slot', () => {
      const result = findAdministrationTimeSlotFromIdealTime('06:00');

      expect(result).toEqual({
        index: breakfastSlotIndex,
        timeSlot: breakfastSlot,
        value: '06:00',
      });
    });

    it('matches a time in the middle of the time slot', () => {
      const result = findAdministrationTimeSlotFromIdealTime('07:30');

      expect(result).toEqual({
        index: breakfastSlotIndex,
        timeSlot: breakfastSlot,
        value: '07:30',
      });
    });

    it('matches one minute before the end of the time slot', () => {
      const result = findAdministrationTimeSlotFromIdealTime('07:59');

      expect(result).toEqual({
        index: breakfastSlotIndex,
        timeSlot: breakfastSlot,
        value: '07:59',
      });
    });
  });

  describe('slot boundaries', () => {
    it('assigns the end of a slot to the next slot', () => {
      const result = findAdministrationTimeSlotFromIdealTime('08:00');

      expect(result.index).toBe(morningSlotIndex);
      expect(result.timeSlot).toEqual(morningSlot);
      expect(result.value).toEqual('08:00');
    });

    it('assigns the last minute of the day to the night slot', () => {
      const result = findAdministrationTimeSlotFromIdealTime('23:59');

      expect(result.index).toBe(nightSlotIndex);
      expect(result.timeSlot).toEqual(nightSlot);
      expect(result.value).toEqual('23:59');
    });
  });

  describe('Date inputs', () => {
    it('accepts a Date and matches by minute, ignoring seconds', () => {
      const idealTime = set(new Date(), { hours: 7, minutes: 30, seconds: 45 });
      const result = findAdministrationTimeSlotFromIdealTime(idealTime);

      expect(result.index).toBe(breakfastSlotIndex);
      expect(result.timeSlot).toEqual(breakfastSlot);
      expect(result.value).toEqual(idealTime);
    });
  });
});

describe('getAutocalculatedDispensingQuantity', () => {
  const base = {
    doseAmount: 1,
    unitConversion: 1,
    frequency: ADMINISTRATION_FREQUENCIES.DAILY,
    durationValue: 5,
    durationUnit: MEDICATION_DURATION_UNITS.DAYS,
    isOngoing: false,
    isVariableDose: false,
  };

  it('multiplies dose × frequency × duration in days', () => {
    // 1 dose/day × 5 days = 5
    expect(getAutocalculatedDispensingQuantity(base)).toBe(5);
  });

  it('applies the frequency doses-per-day multiplier', () => {
    // 2 mL × 3 doses/day × 5 days = 30 dosing units
    expect(
      getAutocalculatedDispensingQuantity({
        ...base,
        doseAmount: 2,
        frequency: ADMINISTRATION_FREQUENCIES.THREE_TIMES_DAILY,
      }),
    ).toBe(30);
  });

  it('converts dosing units to dispensing units and rounds up once', () => {
    // 2 mL × 3 doses/day × 5 days = 30 mL, ÷ 5 mL per vial = 6 vials
    expect(
      getAutocalculatedDispensingQuantity({
        ...base,
        doseAmount: 2,
        unitConversion: 5,
        frequency: ADMINISTRATION_FREQUENCIES.THREE_TIMES_DAILY,
      }),
    ).toBe(6);
  });

  it('rounds up a fractional total to the next whole dispensing unit', () => {
    // 1 × 1 × 5 = 5 dosing units, ÷ 2 = 2.5 → 3
    expect(getAutocalculatedDispensingQuantity({ ...base, unitConversion: 2 })).toBe(3);
  });

  it('treats weeks as 7 days', () => {
    expect(
      getAutocalculatedDispensingQuantity({
        ...base,
        durationValue: 2,
        durationUnit: MEDICATION_DURATION_UNITS.WEEKS,
      }),
    ).toBe(14);
  });

  it('treats one month as 30 days', () => {
    expect(
      getAutocalculatedDispensingQuantity({
        ...base,
        durationValue: 1,
        durationUnit: MEDICATION_DURATION_UNITS.MONTHS,
      }),
    ).toBe(30);
  });

  it('handles fractional doses-per-day frequencies', () => {
    // Once a week (1/7 per day) over 4 weeks (28 days) = 4 doses
    expect(
      getAutocalculatedDispensingQuantity({
        ...base,
        frequency: ADMINISTRATION_FREQUENCIES.ONCE_A_WEEK,
        durationValue: 4,
        durationUnit: MEDICATION_DURATION_UNITS.WEEKS,
      }),
    ).toBe(4);
  });

  it('treats once a month as one dose per 30-day month', () => {
    // 3 units, once a month, over 3 months (90 days) = 3 administrations × 3 = 9
    expect(
      getAutocalculatedDispensingQuantity({
        ...base,
        doseAmount: 3,
        frequency: ADMINISTRATION_FREQUENCIES.ONCE_A_MONTH,
        durationValue: 3,
        durationUnit: MEDICATION_DURATION_UNITS.MONTHS,
      }),
    ).toBe(9);
  });

  it('defaults ongoing medications to a one-month (30 day) supply', () => {
    expect(
      getAutocalculatedDispensingQuantity({
        ...base,
        isOngoing: true,
        durationValue: undefined,
        durationUnit: undefined,
      }),
    ).toBe(30);
  });

  describe('non-calculable prescriptions return null', () => {
    it('variable dose', () => {
      expect(getAutocalculatedDispensingQuantity({ ...base, isVariableDose: true })).toBeNull();
    });

    it("frequency of 'As directed'", () => {
      expect(
        getAutocalculatedDispensingQuantity({
          ...base,
          frequency: ADMINISTRATION_FREQUENCIES.AS_DIRECTED,
        }),
      ).toBeNull();
    });

    it('duration in hours', () => {
      expect(
        getAutocalculatedDispensingQuantity({
          ...base,
          durationValue: 12,
          durationUnit: MEDICATION_DURATION_UNITS.HOURS,
        }),
      ).toBeNull();
    });

    it('empty duration when not ongoing', () => {
      expect(
        getAutocalculatedDispensingQuantity({
          ...base,
          durationValue: undefined,
          durationUnit: undefined,
        }),
      ).toBeNull();
    });

    it('duration value without a unit', () => {
      expect(
        getAutocalculatedDispensingQuantity({ ...base, durationUnit: undefined }),
      ).toBeNull();
    });

    it("frequency of 'Immediately' with no duration", () => {
      // Immediately always has an empty duration, so it never auto-calculates.
      expect(
        getAutocalculatedDispensingQuantity({
          ...base,
          frequency: ADMINISTRATION_FREQUENCIES.IMMEDIATELY,
          durationValue: undefined,
          durationUnit: undefined,
        }),
      ).toBeNull();
    });

    it('missing dose amount', () => {
      expect(getAutocalculatedDispensingQuantity({ ...base, doseAmount: undefined })).toBeNull();
    });

    it('zero or negative dose amount', () => {
      expect(getAutocalculatedDispensingQuantity({ ...base, doseAmount: 0 })).toBeNull();
    });
  });

  it('defaults unitConversion to 1 when missing or invalid', () => {
    expect(
      getAutocalculatedDispensingQuantity({ ...base, unitConversion: undefined }),
    ).toBe(5);
    expect(getAutocalculatedDispensingQuantity({ ...base, unitConversion: 0 })).toBe(5);
  });

  it('accepts numeric strings for dose, duration and conversion', () => {
    expect(
      getAutocalculatedDispensingQuantity({
        ...base,
        doseAmount: '2',
        unitConversion: '5',
        durationValue: '5',
        frequency: ADMINISTRATION_FREQUENCIES.THREE_TIMES_DAILY,
      }),
    ).toBe(6);
  });
});
