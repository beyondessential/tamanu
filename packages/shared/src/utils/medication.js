import { addDays, format, isSameDay, set } from 'date-fns';
import {
  DRUG_UNIT_LABELS,
  DRUG_UNIT_PLURAL_LABELS,
  DRUG_UNIT_SHORT_LABELS,
  MEDICATION_ADMINISTRATION_TIME_SLOTS,
} from '@tamanu/constants';
import { camelCase } from 'es-toolkit/compat';

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
