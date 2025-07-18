import {
  ADMINISTRATION_FREQUENCY_SYNONYMS,
  MEDICATION_ADMINISTRATION_TIME_SLOTS,
} from '~/constants/medications';
import { FrequencySuggestion } from './frequencySuggester';
import { camelCase } from 'lodash';
import { addDays, format, isSameDay, set } from 'date-fns';

export const getTranslatedFrequencySynonyms = (
  frequenciesEnabled: Record<string, boolean> | undefined,
  getTranslation: (key: string, fallback: string) => string,
): Record<string, string[]> => {
  const result: Record<string, string[]> = {};

  Object.entries(ADMINISTRATION_FREQUENCY_SYNONYMS).forEach(([frequency, synonyms]) => {
    // If frequenciesEnabled is provided, filter out disabled frequencies
    if (frequenciesEnabled && !frequenciesEnabled[frequency]) {
      return;
    }

    // Use the frequency itself as the key/label
    const labelKey = getTranslation(
      `medication.frequency.${camelCase(frequency)}.label`,
      frequency,
    );

    // Translate synonyms (for now, just use the synonyms as-is since mobile doesn't have complex translation setup)
    const translatedSynonyms = synonyms.map((synonym, index) =>
      getTranslation(`medication.frequency.${camelCase(frequency)}.synonym.${index}`, synonym),
    );

    result[labelKey] = translatedSynonyms;
  });

  return result;
};

export const getFrequencySuggestions = (
  synonyms: Record<string, string[]>,
): FrequencySuggestion[] => {
  return Object.entries(synonyms).map(([key, value]) => ({
    label: `${key} (${value[0]})`,
    value: key,
    synonyms: value,
  }));
};

export const getDateFromTimeString = (time: string, initialDate = new Date()) => {
  if (typeof time !== 'string' || !time?.includes?.(':')) {
    time = format(new Date(time), 'HH:mm');
  }
  const parsedTime = time.split(':');
  const hour = parseInt(parsedTime[0]);
  const minute = parseInt(parsedTime[1]) || 0;
  return set(initialDate, { hours: hour, minutes: minute, seconds: 0 });
};

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

export const areDatesInSameTimeSlot = (date1: Date, date2: Date) => {
  if (!isSameDay(date1, date2)) {
    return false;
  }
  const slot1 = findAdministrationTimeSlotFromIdealTime(date1);
  const slot2 = findAdministrationTimeSlotFromIdealTime(date2);
  return slot1.index === slot2.index;
};

export const getFirstAdministrationDate = (startDate: Date, idealTimes: string[]) => {
  const firstStartTime = idealTimes
    .map(idealTime => getDateFromTimeString(idealTime, startDate))
    .concat(idealTimes.map(idealTime => getDateFromTimeString(idealTime, addDays(startDate, 1))))
    .filter(
      idealTime =>
        idealTime.getTime() > startDate.getTime() || areDatesInSameTimeSlot(startDate, idealTime),
    )
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return firstStartTime;
};
