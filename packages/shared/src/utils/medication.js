import { addDays, format, isSameDay, set } from 'date-fns';
import {
  ADMINISTRATION_FREQUENCIES,
  ADMINISTRATION_FREQUENCY_DETAILS,
  DRUG_UNIT_LABELS,
  DRUG_UNIT_PLURAL_LABELS,
  DRUG_UNIT_SHORT_LABELS,
  MEDICATION_ADMINISTRATION_TIME_SLOTS,
  MEDICATION_DURATION_UNITS,
} from '@tamanu/constants';
import { camelCase } from 'es-toolkit/compat';

// One month is always treated as 30 days for dispensing quantity calculations.
const DAYS_PER_MONTH = 30;

const DAYS_PER_DURATION_UNIT = {
  [MEDICATION_DURATION_UNITS.DAYS]: 1,
  [MEDICATION_DURATION_UNITS.WEEKS]: 7,
  [MEDICATION_DURATION_UNITS.MONTHS]: DAYS_PER_MONTH,
};

const getDurationInDays = ({ isImmediately, isOngoing, durationValue, durationUnit }) => {
  // 'Immediately' has no duration and covers a single administration (one day / one dose).
  if (isImmediately) return 1;
  // Ongoing medications default to a one-month (30 day) supply.
  if (isOngoing) return DAYS_PER_MONTH;
  return Number(durationValue) * DAYS_PER_DURATION_UNIT[durationUnit];
};

/**
 * @template {`${number}:${number}` | Date} T
 * @param {T} idealTime - A time string (HH:mm) whose time falls within a slot.
 * @returns {{
 *   index: number
 *   timeSlot: (typeof MEDICATION_ADMINISTRATION_TIME_SLOTS)[number] | undefined,
 *   value: T
 * }}
 */
export const findAdministrationTimeSlotFromIdealTime = idealTime => {
  const ideal = getDateFromTimeString(idealTime).getTime();
  const index = MEDICATION_ADMINISTRATION_TIME_SLOTS.findIndex(slot => {
    const start = getDateFromTimeString(slot.startTime).getTime();
    if (ideal < start) return false;
    const end = getDateFromTimeString(slot.endTime).getTime();
    return ideal < end;
  });

  return {
    index,
    timeSlot: MEDICATION_ADMINISTRATION_TIME_SLOTS[index],
    value: idealTime,
  };
};

export const getDateFromTimeString = (time, initialDate = new Date()) => {
  const asString =
    typeof time !== 'string' || !time?.includes?.(':') ? format(new Date(time), 'HH:mm') : time;
  const [hh, mm] = asString.split(':');
  const hour = Number.parseInt(hh);
  const minute = Number.parseInt(mm) || 0;
  return set(initialDate, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
};

export const areDatesInSameTimeSlot = (date1, date2) => {
  if (!isSameDay(date1, date2)) {
    return false;
  }
  const slot1 = findAdministrationTimeSlotFromIdealTime(date1);
  const slot2 = findAdministrationTimeSlotFromIdealTime(date2);
  return slot1.index === slot2.index;
};

export const getFirstAdministrationDate = (startDate, idealTimes) => {
  const firstStartTime = idealTimes
    .map(idealTime => getDateFromTimeString(idealTime, startDate))
    .concat(idealTimes.map(idealTime => getDateFromTimeString(idealTime, addDays(startDate, 1))))
    .filter(
      idealTime =>
        idealTime.getTime() > startDate.getTime() || areDatesInSameTimeSlot(startDate, idealTime),
    )
    .sort((a, b) => a - b)[0];

  return firstStartTime;
};

export const getMedicationDoseDisplay = (medication, getTranslation, getEnumTranslation) => {
  let { doseAmount, dosingUnit, isVariableDose } = medication;
  if (isVariableDose) doseAmount = getTranslation('medication.table.variable', 'Variable');
  return getMarDoseDisplay({ doseAmount, dosingUnit }, getEnumTranslation);
};

export const getMarDoseDisplay = ({ doseAmount, dosingUnit }, getEnumTranslation) => {
  return `${doseAmount ?? ''} ${getEnumTranslation(DRUG_UNIT_SHORT_LABELS, dosingUnit) ?? ''}`.trim();
};

export const getTranslatedFrequency = (frequency, getTranslation) => {
  return getTranslation(`medication.frequency.${camelCase(frequency)}.label`, frequency);
};

// Returns the singular or plural drug unit label for a given quantity.
// Uses the curated DRUG_UNIT_PLURAL_LABELS (not a generic inflection library) so
// irregular plurals (e.g. Suppository → Suppositories) are handled correctly.
// quantity <= 1 or non-numeric → singular.
export const getDrugUnitLabel = (unitKey, quantity, getEnumTranslation) => {
  const isPlural = Number.isFinite(Number(quantity)) && Number(quantity) > 1;
  return getEnumTranslation(isPlural ? DRUG_UNIT_PLURAL_LABELS : DRUG_UNIT_LABELS, unitKey);
};

/**
 * Auto-calculates the dispensing quantity (in dispensing units) for a prescription:
 *
 *   dispensing quantity = ceil(doseAmount / unitConversion × dosesPerDay × durationInDays)
 *
 * `doseAmount` is measured in dosing units and `unitConversion` is how many dosing units
 * make up one dispensing unit (both snapshotted onto the prescription at creation time).
 * Doses are summed across the whole course before rounding up once, matching the invoice
 * quantity logic in `Prescription.recalculateAndApplyInvoiceQuantity`.
 *
 * Returns `null` when a quantity should not be auto-calculated (and should be left blank for
 * manual entry):
 *  - variable dose (no fixed dose amount)
 *  - frequency of 'As directed' (no schedule)
 *  - duration expressed in hours
 *  - no duration and not an ongoing medication
 *  - missing/invalid dose amount or frequency
 *
 * @param {object} prescription
 * @param {number|string} prescription.doseAmount
 * @param {number|string} [prescription.unitConversion] - defaults to 1
 * @param {string} prescription.frequency - an ADMINISTRATION_FREQUENCIES value
 * @param {number|string} [prescription.durationValue]
 * @param {string} [prescription.durationUnit] - a MEDICATION_DURATION_UNITS value
 * @param {boolean} [prescription.isOngoing]
 * @param {boolean} [prescription.isVariableDose]
 * @returns {number|null}
 */
export const getAutocalculatedDispensingQuantity = ({
  doseAmount,
  unitConversion,
  frequency,
  durationValue,
  durationUnit,
  isOngoing,
  isVariableDose,
}) => {
  if (isVariableDose) return null;
  if (frequency === ADMINISTRATION_FREQUENCIES.AS_DIRECTED) return null;
  if (durationUnit === MEDICATION_DURATION_UNITS.HOURS) return null;

  const dose = Number(doseAmount);
  if (!Number.isFinite(dose) || dose <= 0) return null;

  // 'Immediately' is a single administration: frequency multiplier of 1 and no duration, so the
  // quantity is just enough for that one dose (dose ÷ unitConversion).
  const isImmediately = frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY;

  const dosesPerDay = isImmediately ? 1 : ADMINISTRATION_FREQUENCY_DETAILS[frequency]?.dosesPerDay;
  if (!dosesPerDay || dosesPerDay <= 0) return null;

  const durationInDays = getDurationInDays({ isImmediately, isOngoing, durationValue, durationUnit });
  if (!Number.isFinite(durationInDays) || durationInDays <= 0) return null;

  const conversion = Number(unitConversion) || 1;
  return Math.ceil((dose * dosesPerDay * durationInDays) / conversion);
};
