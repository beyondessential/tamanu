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
 * owes their admission night, so it falls back to [startDateTime]. So total nights = array length,
 * which for an N-night stay (admit day D, discharge day D+N) is N.
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

  return instants.length > 0 ? instants : [startDateTime];
};
