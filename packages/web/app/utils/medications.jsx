import React from 'react';
import { ADMINISTRATION_FREQUENCY_SYNONYMS } from '@tamanu/constants';
import { camelCase } from 'lodash';
import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import { DateDisplay, useFormatTime } from '@tamanu/ui-components';

export const getTranslatedFrequencySynonyms = (frequenciesEnabled, getTranslation) => {
  const result = {};
  Object.entries(ADMINISTRATION_FREQUENCY_SYNONYMS).forEach(([frequency, synonyms]) => {
    if (!frequenciesEnabled?.[frequency]) return;
    const labelKey = getTranslation(
      `medication.frequency.${camelCase(frequency)}.label`,
      frequency,
    );

    const translatedSynonyms = synonyms.map((synonym, index) =>
      getTranslation(`medication.frequency.${camelCase(frequency)}.synonym.${index}`, synonym),
    );

    result[labelKey] = translatedSynonyms;
  });

  return result;
};

export const getTranslatedFrequencySynonym = (synonyms, index, getTranslation) => {
  const frequency = synonyms[index];
  return getTranslation(`medication.frequency.${camelCase(frequency)}.synonym.${index}`, frequency);
};

export const TimeSlotDisplay = ({ time }) => <DateDisplay date={time} showTime removeWhitespace style={{ textTransform: 'lowercase' }} />;

export const useTimeSlotDisplay = (time) => {
  const timeString = useFormatTime(time, { removeWhitespace: true });
  return timeString.toLowerCase();
};

export const isWithinTimeSlot = (timeSlot, time, isFuture = false) => {
  if (!time || !timeSlot || isFuture) return true; // Skip validation if no value or timeSlot or isFuture

  // Convert times to minutes since midnight for easier comparison
  const timeToMinutes = date => date.getHours() * 60 + date.getMinutes();

  // Get the minutes for the selected time
  const selectedTimeMinutes = timeToMinutes(new Date(time));

  const slotStartMinutes = timeToMinutes(getDateFromTimeString(timeSlot.startTime));
  const slotEndMinutes = timeToMinutes(getDateFromTimeString(timeSlot.endTime));

  // Check if the time slot crosses midnight
  if (slotEndMinutes < slotStartMinutes) {
    // For time slots that cross midnight
    return selectedTimeMinutes >= slotStartMinutes || selectedTimeMinutes <= slotEndMinutes;
  } else {
    // For normal time slots within the same day
    return selectedTimeMinutes >= slotStartMinutes && selectedTimeMinutes <= slotEndMinutes;
  }
};

export const createPrescriptionHash = prescription =>
  `${prescription.medicationId}-${prescription.doseAmount}-${prescription.units}-${prescription.route}-${prescription.frequency}`;
