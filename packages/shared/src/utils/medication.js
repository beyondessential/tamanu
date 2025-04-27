import { formatTime } from '@tamanu/utils/dateTime';
import { set } from 'date-fns';
import { DRUG_UNIT_SHORT_LABELS, MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { camelCase } from 'lodash';

export const findAdministrationTimeSlotFromIdealTime = (idealTime) => {
  const index = MEDICATION_ADMINISTRATION_TIME_SLOTS.findIndex((slot) => {
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
  const parsedTime = time.split(':');
  const hour = parseInt(parsedTime[0]);
  const minute = parseInt(parsedTime[1]) || 0;
  return set(initialDate, { hours: hour, minutes: minute, seconds: 0 });
};

export const formatTimeSlot = time => {
  return formatTime(time)
    .replaceAll(' ', '')
    .toLowerCase();
};

export const getDose = (medication, getTranslation, getEnumTranslation) => {
  let { doseAmount, units, isVariableDose } = medication;
  if (!units) return '';
  if (isVariableDose) doseAmount = getTranslation('medication.table.variable', 'Variable');
  return `${doseAmount} ${getEnumTranslation(DRUG_UNIT_SHORT_LABELS, units)}`;
};

export const getTranslatedFrequency = (frequency, getTranslation) => {
  return getTranslation(`medication.frequency.${camelCase(frequency)}.label`, frequency);
};
