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
  /** Weekday standard-hours window, 'HH:mm'. */
  standardHoursStart: string;
  standardHoursEnd: string;
  isPharmacyEncounter?: boolean;
  chargePharmacyEncounterFee?: boolean;
}

const minutesIntoDay = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

/**
 * Pick the encounter-fee reference-data code for an encounter, or null when no fee applies.
 *
 * Time-of-day is evaluated in facility-local time — stored datetimes are in the primary
 * timezone, so a near-midnight encounter would otherwise bucket against the wrong day.
 * Weekday standard hours are [start, end] inclusive; the weekend window runs from Friday's
 * standard-hours end through Monday's standard-hours start. Returns the weekend code even
 * where a state doesn't run a distinct weekend fee — the product lookup falls back to the
 * after-hours product when no weekend product is configured.
 */
export const selectEncounterFeeCode = ({
  encounterType,
  startDateTime,
  primaryTimeZone,
  facilityTimeZone,
  standardHoursStart,
  standardHoursEnd,
  isPharmacyEncounter = false,
  chargePharmacyEncounterFee = true,
}: EncounterFeeSelectionInput): string | null => {
  // Emergency family: a single ED fee, with no time-of-day component.
  if (EMERGENCY_ENCOUNTER_TYPES.includes(encounterType)) {
    return ENCOUNTER_FEE_CODES.EMERGENCY;
  }

  // Only clinic (outpatient) encounters attract a time-bucketed fee.
  if (encounterType !== ENCOUNTER_TYPES.CLINIC) {
    return null;
  }

  // Pharmacy walk-ins are skipped where the facility doesn't charge them.
  if (isPharmacyEncounter && !chargePharmacyEncounterFee) {
    return null;
  }

  const displayTimeZone = facilityTimeZone || primaryTimeZone;
  const plain = Temporal.PlainDateTime.from(String(startDateTime).replace(' ', 'T'));
  const local = primaryTimeZone
    ? plain.toZonedDateTime(primaryTimeZone).withTimeZone(displayTimeZone)
    : plain.toZonedDateTime(displayTimeZone);

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
    return ENCOUNTER_FEE_CODES.WEEKEND;
  }

  const isStandardHours = minutes >= startMinutes && minutes <= endMinutes;
  return isStandardHours ? ENCOUNTER_FEE_CODES.STANDARD : ENCOUNTER_FEE_CODES.AFTER_HOURS;
};
