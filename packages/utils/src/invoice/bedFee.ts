import { Temporal } from 'temporal-polyfill';

export interface BedFeeChargeInstantsInput {
  /** Admission start, stored ISO 9075 in the primary timezone. */
  startDateTime: string;
  /** Discharge time, or "now" for a still-admitted patient, stored ISO 9075 in the primary timezone. */
  endDateTime: string;
  /** Facility-local time of the nightly overnight check, 'HH:mm'. */
  overnightChargeTime: string;
  primaryTimeZone: string;
  facilityTimeZone?: string | null;
}

const toIso9075 = (zoned: Temporal.ZonedDateTime, timeZone: string): string =>
  zoned.withTimeZone(timeZone).toPlainDateTime().toString().replace('T', ' ').slice(0, 19);

/**
 * The instants (in the primary timezone) a still-admitted patient is charged a bed-fee night for:
 * one per facility-local overnight-check time in (start, end]. A check on the admission day itself
 * (e.g. an early-hours admission before the check time) is included — the patient is charged for
 * the night they were admitted in.
 *
 * The result is never empty — a patient admitted and gone before the first overnight check still
 * owes their admission night, so it falls back to a single instant at the end of the stay (now for
 * a still-admitted patient, or the discharge time). Anchoring the fallback to the end makes the
 * night follow the patient's current location, so an early ward move is reflected immediately.
 * Total nights = array length, which for an N-night stay (admit day D, discharge day D+N) is N.
 *
 * Each instant is later resolved to the location the patient occupied at that time — the rate is
 * set by the location at the overnight check.
 */
export const computeBedFeeChargeInstants = ({
  startDateTime,
  endDateTime,
  overnightChargeTime,
  primaryTimeZone,
  facilityTimeZone,
}: BedFeeChargeInstantsInput): string[] => {
  const displayTimeZone = facilityTimeZone ?? primaryTimeZone;
  const toLocal = (stored: string): Temporal.ZonedDateTime => {
    const plain = Temporal.PlainDateTime.from(stored.replace(' ', 'T'));
    return plain.toZonedDateTime(primaryTimeZone).withTimeZone(displayTimeZone);
  };

  const start = toLocal(startDateTime);
  const end = toLocal(endDateTime);
  const [hour = 0, minute = 0] = overnightChargeTime.split(':').map(Number);

  // First overnight check strictly after admission.
  let check = start.withPlainTime({ hour, minute, second: 0 });
  if (Temporal.ZonedDateTime.compare(check, start) <= 0) {
    check = check.add({ days: 1 });
  }

  const instants: string[] = [];
  while (Temporal.ZonedDateTime.compare(check, end) <= 0) {
    instants.push(toIso9075(check, primaryTimeZone));
    check = check.add({ days: 1 });
  }

  // Minimum one night: a stay that hasn't crossed an overnight check still owes a night. Anchor
  // the fallback to the end of the stay (now for a still-admitted patient, or the discharge time)
  // so the night follows the patient's current location — an early ward move is reflected at once.
  return instants.length > 0 ? instants : [endDateTime];
};

export interface BedFeeLocationChange {
  /** Effective time of the location change, a primary-tz ISO 9075 string. */
  date: string;
  locationId: string | null;
}

/**
 * Tally bed-fee nights per location: each charge instant is attributed to the location occupied
 * then (latest change at or before it), else the current location. Inputs are ascending ISO 9075.
 */
export const countBedFeeNightsByLocation = (
  chargeInstants: string[],
  locationChanges: BedFeeLocationChange[],
  currentLocationId: string | null,
): Map<string, number> => {
  const locationIdAtInstant = (instant: string): string | null => {
    let locationId: string | null | undefined;
    for (const change of locationChanges) {
      if (change.date > instant) break; // ascending — no later change can precede this instant
      locationId = change.locationId;
    }
    return locationId ?? currentLocationId ?? null;
  };

  const nightsByLocation = new Map<string, number>();
  for (const instant of chargeInstants) {
    const locationId = locationIdAtInstant(instant);
    if (!locationId) {
      continue;
    }
    nightsByLocation.set(locationId, (nightsByLocation.get(locationId) ?? 0) + 1);
  }
  return nightsByLocation;
};
