import { describe, it, expect } from 'vitest';
import { ENCOUNTER_TYPES, ENCOUNTER_FEE_CODES } from '@tamanu/constants';
import { selectEncounterFeeCode } from '../src';

// 2024-06-18 is a Tuesday; 21 Fri, 22 Sat, 23 Sun, 24 Mon.
const base = {
  primaryTimeZone: 'UTC',
  facilityTimeZone: null,
  standardHoursStart: '08:00',
  standardHoursEnd: '17:00',
};

describe('selectEncounterFeeCode', () => {
  it('returns the ED fee for emergency-family encounters', () => {
    for (const encounterType of [
      ENCOUNTER_TYPES.TRIAGE,
      ENCOUNTER_TYPES.EMERGENCY,
      ENCOUNTER_TYPES.OBSERVATION,
    ]) {
      expect(
        selectEncounterFeeCode({ ...base, encounterType, startDateTime: '2024-06-18 10:00:00' }),
      ).toBe(ENCOUNTER_FEE_CODES.EMERGENCY);
    }
  });

  it('buckets a weekday clinic encounter in standard hours', () => {
    expect(
      selectEncounterFeeCode({
        ...base,
        encounterType: ENCOUNTER_TYPES.CLINIC,
        startDateTime: '2024-06-18 10:00:00',
      }),
    ).toBe(ENCOUNTER_FEE_CODES.STANDARD);
  });

  it('buckets a weekday clinic encounter outside standard hours as after-hours', () => {
    expect(
      selectEncounterFeeCode({
        ...base,
        encounterType: ENCOUNTER_TYPES.CLINIC,
        startDateTime: '2024-06-18 18:30:00',
      }),
    ).toBe(ENCOUNTER_FEE_CODES.AFTER_HOURS);
    expect(
      selectEncounterFeeCode({
        ...base,
        encounterType: ENCOUNTER_TYPES.CLINIC,
        startDateTime: '2024-06-18 06:00:00',
      }),
    ).toBe(ENCOUNTER_FEE_CODES.AFTER_HOURS);
  });

  it('treats the standard-hours boundaries as inclusive', () => {
    expect(
      selectEncounterFeeCode({
        ...base,
        encounterType: ENCOUNTER_TYPES.CLINIC,
        startDateTime: '2024-06-18 08:00:00',
      }),
    ).toBe(ENCOUNTER_FEE_CODES.STANDARD);
    expect(
      selectEncounterFeeCode({
        ...base,
        encounterType: ENCOUNTER_TYPES.CLINIC,
        startDateTime: '2024-06-18 17:00:00',
      }),
    ).toBe(ENCOUNTER_FEE_CODES.STANDARD);
  });

  it('applies the weekend window from Friday close to Monday open', () => {
    expect(
      selectEncounterFeeCode({
        ...base,
        encounterType: ENCOUNTER_TYPES.CLINIC,
        startDateTime: '2024-06-22 11:00:00',
      }),
    ).toBe(ENCOUNTER_FEE_CODES.WEEKEND); // Saturday
    expect(
      selectEncounterFeeCode({
        ...base,
        encounterType: ENCOUNTER_TYPES.CLINIC,
        startDateTime: '2024-06-21 17:30:00',
      }),
    ).toBe(ENCOUNTER_FEE_CODES.WEEKEND); // Friday after close
    expect(
      selectEncounterFeeCode({
        ...base,
        encounterType: ENCOUNTER_TYPES.CLINIC,
        startDateTime: '2024-06-21 10:00:00',
      }),
    ).toBe(ENCOUNTER_FEE_CODES.STANDARD); // Friday in hours
    expect(
      selectEncounterFeeCode({
        ...base,
        encounterType: ENCOUNTER_TYPES.CLINIC,
        startDateTime: '2024-06-24 07:30:00',
      }),
    ).toBe(ENCOUNTER_FEE_CODES.WEEKEND); // Monday before open
    expect(
      selectEncounterFeeCode({
        ...base,
        encounterType: ENCOUNTER_TYPES.CLINIC,
        startDateTime: '2024-06-24 08:30:00',
      }),
    ).toBe(ENCOUNTER_FEE_CODES.STANDARD); // Monday after open
  });

  it('evaluates time-of-day in facility-local time, not the primary timezone', () => {
    // Tue 22:00 UTC is Wed 09:00 at +11:00 → standard hours, not after-hours.
    expect(
      selectEncounterFeeCode({
        ...base,
        facilityTimeZone: '+11:00',
        encounterType: ENCOUNTER_TYPES.CLINIC,
        startDateTime: '2024-06-18 22:00:00',
      }),
    ).toBe(ENCOUNTER_FEE_CODES.STANDARD);
  });

  it('returns null for encounter types that do not attract an encounter fee', () => {
    for (const encounterType of [
      ENCOUNTER_TYPES.ADMISSION,
      ENCOUNTER_TYPES.IMAGING,
      ENCOUNTER_TYPES.VACCINATION,
      ENCOUNTER_TYPES.SURVEY_RESPONSE,
    ]) {
      expect(
        selectEncounterFeeCode({ ...base, encounterType, startDateTime: '2024-06-18 10:00:00' }),
      ).toBeNull();
    }
  });
});
