import { addDays, format, isSameDay, set } from 'date-fns';
import { DRUG_UNIT_SHORT_LABELS, MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { camelCase } from 'lodash';

export const findAdministrationTimeSlotFromIdealTime = idealTime => {
  const index = MEDICATION_ADMINISTRATION_TIME_SLOTS.findIndex(slot => {
    const startDate = getDateFromTimeString(slot.startTime).getTime();
    const endDate = getDateFromTimeString(slot.endTime).getTime();
    const idealDate = getDateFromTimeString(idealTime).getTime();

    return (
      idealDate >= startDate && idealDate < endDate && idealDate - startDate < endDate - startDate
    );
  });

  const timeSlot = MEDICATION_ADMINISTRATION_TIME_SLOTS[index];
  return {
    index,
    timeSlot,
    value: idealTime,
  };
};

export const getDateFromTimeString = (time, initialDate = new Date()) => {
  if (typeof time !== 'string' || !time?.includes?.(':')) {
    time = format(new Date(time), 'HH:mm');
  }
  const parsedTime = time.split(':');
  const hour = parseInt(parsedTime[0]);
  const minute = parseInt(parsedTime[1]) || 0;
  return set(initialDate, { hours: hour, minutes: minute, seconds: 0 });
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
  let { doseAmount, units, isVariableDose } = medication;
  if (isVariableDose) doseAmount = getTranslation('medication.table.variable', 'Variable');
  return getMarDoseDisplay({ doseAmount, units }, getEnumTranslation);
};

export const getMarDoseDisplay = ({ doseAmount, units }, getEnumTranslation) => {
  return `${doseAmount ?? ''} ${getEnumTranslation(DRUG_UNIT_SHORT_LABELS, units) ?? ''}`.trim();
};

export const getTranslatedFrequency = (frequency, getTranslation) => {
  return getTranslation(`medication.frequency.${camelCase(frequency)}.label`, frequency);
};
