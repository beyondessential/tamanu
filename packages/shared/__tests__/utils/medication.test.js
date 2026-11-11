import { describe, expect, it } from 'vitest';
import { set } from 'date-fns';

import {
  ADMINISTRATION_FREQUENCIES,
  ADMINISTRATION_FREQUENCY_DETAILS,
  DRUG_LIMIT_BREACHES,
  MEDICATION_ADMINISTRATION_TIME_SLOTS,
  MEDICATION_DURATION_UNITS,
} from '@tamanu/constants';
import {
  findAdministrationTimeSlotFromIdealTime,
  getAutocalculatedDispensingQuantity,
  getDefaultIdealTimes,
  getDispensingQuantityLimitBreach,
  getDoseLimitBreach,
  getFirstAdministrationDate,
  getLimitBreach,
  validateDrugLimits,
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

  it("treats 'Immediately' as a single administration (frequency 1, one dose)", () => {
    // 2 units immediately, no duration → one dose of 2 ÷ 5 per pack = 0.4 → 1
    expect(
      getAutocalculatedDispensingQuantity({
        ...base,
        doseAmount: 2,
        unitConversion: 5,
        frequency: ADMINISTRATION_FREQUENCIES.IMMEDIATELY,
        durationValue: undefined,
        durationUnit: undefined,
      }),
    ).toBe(1);
    // with a 1:1 conversion the quantity is just the single dose
    expect(
      getAutocalculatedDispensingQuantity({
        ...base,
        doseAmount: 2,
        frequency: ADMINISTRATION_FREQUENCIES.IMMEDIATELY,
        durationValue: undefined,
        durationUnit: undefined,
      }),
    ).toBe(2);
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

describe('getDefaultIdealTimes', () => {
  it('uses the configured times for a frequency a deployment can customise', () => {
    const configured = { [ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY]: ['07:00', '19:00'] };

    expect(getDefaultIdealTimes(ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY, configured)).toEqual([
      '07:00',
      '19:00',
    ]);
  });

  it('falls back to the fixed times when a customisable frequency is unset', () => {
    expect(getDefaultIdealTimes(ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY, {})).toEqual(
      ADMINISTRATION_FREQUENCY_DETAILS[ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY].startTimes,
    );
  });

  it.each([
    [ADMINISTRATION_FREQUENCIES.HOURLY, 24],
    [ADMINISTRATION_FREQUENCIES.HALF_HOURLY, 48],
  ])('resolves %s to its %i fixed administration times', (frequency, expectedCount) => {
    const idealTimes = getDefaultIdealTimes(frequency, {});

    expect(idealTimes).toEqual(ADMINISTRATION_FREQUENCY_DETAILS[frequency].startTimes);
    expect(idealTimes).toHaveLength(expectedCount);
  });

  // These were removed from the settings schema, so a value stored against them before that is no
  // longer editable in the admin panel and must not quietly drive administration times.
  it.each([ADMINISTRATION_FREQUENCIES.HOURLY, ADMINISTRATION_FREQUENCIES.HALF_HOURLY])(
    'ignores a stale configured value for %s',
    frequency => {
      const configured = { [frequency]: ['09:00'] };

      expect(getDefaultIdealTimes(frequency, configured)).toEqual(
        ADMINISTRATION_FREQUENCY_DETAILS[frequency].startTimes,
      );
    },
  );

  it.each([ADMINISTRATION_FREQUENCIES.IMMEDIATELY, ADMINISTRATION_FREQUENCIES.AS_DIRECTED])(
    'returns no times for %s, which has no schedule',
    frequency => {
      expect(getDefaultIdealTimes(frequency, {})).toEqual([]);
    },
  );

  it('returns no times when no frequency has been chosen yet', () => {
    expect(getDefaultIdealTimes(undefined, {})).toEqual([]);
  });

  it('falls back to the fixed times when the setting has not loaded', () => {
    expect(getDefaultIdealTimes(ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY, undefined)).toEqual(
      ADMINISTRATION_FREQUENCY_DETAILS[ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY].startTimes,
    );
  });
});

describe('getFirstAdministrationDate', () => {
  const everyTwoHours =
    ADMINISTRATION_FREQUENCY_DETAILS[ADMINISTRATION_FREQUENCIES.EVERY_2_HOURS].startTimes;

  it.each([
    ['11:20', '10:00'],
    ['00:30', '00:00'],
    ['22:05', '22:00'],
  ])('starts Every 2 hours at %s in the window holding the start, %s', (start, expected) => {
    const [hours, minutes] = start.split(':').map(Number);
    const startDate = new Date(2026, 9, 22, hours, minutes);
    const [expectedHours, expectedMinutes] = expected.split(':').map(Number);

    expect(getFirstAdministrationDate(startDate, everyTwoHours)).toEqual(
      new Date(2026, 9, 22, expectedHours, expectedMinutes),
    );
  });
});

describe('getLimitBreach', () => {
  it('is in range between the limits and on either limit', () => {
    expect(getLimitBreach(5, 1, 10)).toBeNull();
    expect(getLimitBreach(1, 1, 10)).toBeNull();
    expect(getLimitBreach(10, 1, 10)).toBeNull();
  });

  it('reports the limit crossed', () => {
    expect(getLimitBreach(0.5, 1, 10)).toEqual({ type: DRUG_LIMIT_BREACHES.BELOW_MIN, limit: 1 });
    expect(getLimitBreach(11, 1, 10)).toEqual({ type: DRUG_LIMIT_BREACHES.ABOVE_MAX, limit: 10 });
  });

  it('applies each limit on its own', () => {
    expect(getLimitBreach(500, null, 2)).toEqual({ type: DRUG_LIMIT_BREACHES.ABOVE_MAX, limit: 2 });
    expect(getLimitBreach(500, 1, null)).toBeNull();
    expect(getLimitBreach(0, 1, undefined)).toEqual({
      type: DRUG_LIMIT_BREACHES.BELOW_MIN,
      limit: 1,
    });
    expect(getLimitBreach(500, null, null)).toBeNull();
  });

  it('never flags an empty value', () => {
    expect(getLimitBreach('', 1, 2)).toBeNull();
    expect(getLimitBreach(null, 1, 2)).toBeNull();
    expect(getLimitBreach(undefined, 1, 2)).toBeNull();
  });

  it('compares numeric strings as numbers, as DECIMAL limits and typed input arrive', () => {
    expect(getLimitBreach('9', '1.5', '10')).toBeNull();
    expect(getLimitBreach('10.5', '1.5', '10')).toEqual({
      type: DRUG_LIMIT_BREACHES.ABOVE_MAX,
      limit: 10,
    });
  });
});

describe('getDoseLimitBreach and getDispensingQuantityLimitBreach', () => {
  const referenceDrug = {
    doseMin: '1',
    doseMax: '2',
    dispensingQuantityMin: 10,
    dispensingQuantityMax: 100,
  };

  it('checks a dose against the dose limits only', () => {
    expect(getDoseLimitBreach(3, referenceDrug)).toEqual({
      type: DRUG_LIMIT_BREACHES.ABOVE_MAX,
      limit: 2,
    });
    expect(getDoseLimitBreach(50, referenceDrug)).toEqual({
      type: DRUG_LIMIT_BREACHES.ABOVE_MAX,
      limit: 2,
    });
  });

  it('checks a quantity against the dispensing quantity limits only', () => {
    expect(getDispensingQuantityLimitBreach(2, referenceDrug)).toEqual({
      type: DRUG_LIMIT_BREACHES.BELOW_MIN,
      limit: 10,
    });
    expect(getDispensingQuantityLimitBreach(50, referenceDrug)).toBeNull();
  });

  it('never flags a drug without limits', () => {
    expect(getDoseLimitBreach(500, {})).toBeNull();
    expect(getDoseLimitBreach(500, null)).toBeNull();
    expect(getDispensingQuantityLimitBreach(500)).toBeNull();
  });
});

describe('validateDrugLimits', () => {
  it('accepts blank and valid limits', () => {
    expect(validateDrugLimits({})).toEqual([]);
    expect(
      validateDrugLimits({
        doseMin: 0,
        doseMax: '2.5',
        dispensingQuantityMin: 1,
        dispensingQuantityMax: '100',
      }),
    ).toEqual([]);
    expect(validateDrugLimits({ doseMin: '', doseMax: null })).toEqual([]);
  });

  it('accepts a minimum equal to its maximum', () => {
    expect(validateDrugLimits({ doseMin: 1, doseMax: 1 })).toEqual([]);
  });

  it('rejects a negative limit', () => {
    expect(validateDrugLimits({ doseMin: -1 })).toEqual(['doseMin must be 0 or more']);
    expect(validateDrugLimits({ dispensingQuantityMax: -5 })).toEqual([
      'dispensingQuantityMax must be 0 or more',
    ]);
  });

  it('rejects a dispensing quantity limit that is not a whole number, but not a dose limit', () => {
    expect(validateDrugLimits({ dispensingQuantityMin: 1.5 })).toEqual([
      'dispensingQuantityMin must be a whole number',
    ]);
    expect(validateDrugLimits({ doseMin: 1.5 })).toEqual([]);
  });

  it('rejects a minimum greater than its matching maximum', () => {
    expect(validateDrugLimits({ doseMin: 3, doseMax: 2 })).toEqual([
      'doseMin must not be greater than doseMax',
    ]);
    expect(validateDrugLimits({ dispensingQuantityMin: '30', dispensingQuantityMax: '4' })).toEqual(
      ['dispensingQuantityMin must not be greater than dispensingQuantityMax'],
    );
  });

  it('rejects a limit that is not a number', () => {
    expect(validateDrugLimits({ doseMax: 'two' })).toEqual(['doseMax must be a number']);
  });
});
