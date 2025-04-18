import * as yup from 'yup';
import { numeralTranslation } from '@tamanu/shared/utils/numeralTranslation';
import { isNaN } from 'lodash';
import { getDateFromTimeString } from '@tamanu/shared/utils/medication';

// Foreign keys used to be more complicated nested objects requiring custom
// validation, but they're just strings now. We could remove these validators entirely,
// but there's a benefit to having these field types explicitly treated differently
// (note that an invalid FK will still be rejected by the server,
// so there's no safety issue here)
export const foreignKey = message => yup.string().required(message);
export const optionalForeignKey = () => yup.string();

export const yupAttemptTransformToNumber = (value, originalValue) => {
  if (originalValue === null || originalValue === undefined) return value;
  const translationValue = numeralTranslation(originalValue);
  return isNaN(value) ? translationValue : value;
};

export const isWithinTimeSlot = (timeSlot, time) => {
  if (!time || !timeSlot) return true; // Skip validation if no value or timeSlot

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
