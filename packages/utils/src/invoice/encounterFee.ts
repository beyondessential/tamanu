import { Temporal } from 'temporal-polyfill';
import { ENCOUNTER_TYPES, ENCOUNTER_FEE_CODES } from '@tamanu/constants';

const EMERGENCY_ENCOUNTER_TYPES: string[] = [
  ENCOUNTER_TYPES.TRIAGE,
  ENCOUNTER_TYPES.EMERGENCY,
  ENCOUNTER_TYPES.OBSERVATION,
];

export interface EncounterFeeSelectionInput {
  encounterType: string;
  /** Encounter start, stored ISO 9075 in the primary timezone. */
  startDateTime: string;
  primaryTimeZone: string;
  facilityTimeZone?: string | null;
  /** Weekday standard-hours window for outpatient (clinic) encounters, 'HH:mm'. */
  standardHoursStart: string;
  standardHoursEnd: string;
  /** Weekday standard-hours window for emergency (ED) encounters, 'HH:mm'. */
  emergencyStandardHoursStart: string;
  emergencyStandardHoursEnd: string;
}

interface BucketCodes {
  standard: string;
  afterHours: string;
  weekend: string;
}

const minutesIntoDay = (time: string): number => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Bucket a facility-local time into standard / after-hours / weekend using a weekday hours window.
 * Weekday standard hours are [start, end] inclusive; the weekend window runs from Friday's
 * standard-hours end through Monday's standard-hours start.
 */
const bucketByHours = (
  local: Temporal.ZonedDateTime,
  standardHoursStart: string,
  standardHoursEnd: string,
  codes: BucketCodes,
): string => {
  const dayOfWeek = local.dayOfWeek; // 1 = Monday ... 7 = Sunday
  const minutes = local.hour * 60 + local.minute;
  const startMinutes = minutesIntoDay(standardHoursStart);
  const endMinutes = minutesIntoDay(standardHoursEnd);

  const isWeekend =
    dayOfWeek === 6 || // Saturday
    dayOfWeek === 7 || // Sunday
    (dayOfWeek === 5 && minutes > endMinutes) || // Friday, after standard hours
    (dayOfWeek === 1 && minutes < startMinutes); // Monday, before standard hours
  if (isWeekend) {
    return codes.weekend;
  }

  const isStandardHours = minutes >= startMinutes && minutes <= endMinutes;
  return isStandardHours ? codes.standard : codes.afterHours;
};

/**
 * Pick the encounter-fee reference-data code for an encounter, or null when no fee applies.
 *
 * Both outpatient (clinic) and emergency (ED) encounters attract a time-of-day-bucketed fee —
 * standard / after-hours / weekend — each evaluated against its own facility hours window
 * (outpatient uses the standard-hours setting, emergency uses the emergency-hours setting).
 * Time-of-day is evaluated in facility-local time, so an encounter stored near midnight buckets
 * against the correct day. The weekend code is returned even where a state runs no distinct
 * weekend fee — the product lookup falls back to the matching after-hours product.
 */
export const selectEncounterFeeCode = ({
  encounterType,
  startDateTime,
  primaryTimeZone,
  facilityTimeZone,
  standardHoursStart,
  standardHoursEnd,
  emergencyStandardHoursStart,
  emergencyStandardHoursEnd,
}: EncounterFeeSelectionInput): string | null => {
  const isEmergency = EMERGENCY_ENCOUNTER_TYPES.includes(encounterType);
  const isClinic = encounterType === ENCOUNTER_TYPES.CLINIC;
  if (!isEmergency && !isClinic) {
    return null;
  }

  const displayTimeZone = facilityTimeZone ?? primaryTimeZone;
  const plain = Temporal.PlainDateTime.from(String(startDateTime).replace(' ', 'T'));
  const local = plain.toZonedDateTime(primaryTimeZone).withTimeZone(displayTimeZone);

  if (isEmergency) {
    return bucketByHours(local, emergencyStandardHoursStart, emergencyStandardHoursEnd, {
      standard: ENCOUNTER_FEE_CODES.EMERGENCY_STANDARD,
      afterHours: ENCOUNTER_FEE_CODES.EMERGENCY_AFTER_HOURS,
      weekend: ENCOUNTER_FEE_CODES.EMERGENCY_WEEKEND,
    });
  }

  return bucketByHours(local, standardHoursStart, standardHoursEnd, {
    standard: ENCOUNTER_FEE_CODES.STANDARD,
    afterHours: ENCOUNTER_FEE_CODES.AFTER_HOURS,
    weekend: ENCOUNTER_FEE_CODES.WEEKEND,
  });
};
