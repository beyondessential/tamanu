import * as yup from 'yup';
import { ADMINISTRATION_FREQUENCY_DETAILS } from '@tamanu/constants';

// Function to check if the time window format is valid
const isValidTimeWindowFormat = (time) => {
  const timeRegex = /^([0-9]{2}):00$/;
  const match = time.match(timeRegex);
  if (!match) return false;

  const hour = parseInt(match[1], 10);
  return hour % 2 === 0 && hour >= 0 && hour <= 22; // Valid hours: 00, 02, ..., 22
};

// Function to check if the time format is valid
const isValidTimeFormat = (time) => {
  const timeRegex = /^([0-9]{2}):([0-9]{2})$/;
  const match = time.match(timeRegex);
  if (!match) return false;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

// Function to check if all times are unique 2-hour blocks
const hasUniqueTimeWindows = (times) => {
  const seenWindows = new Set();
  for (const time of times) {
    const windowBlock = parseInt(time.split(':')[0], 10) / 2; // Unique key for 2-hour blocks
    if (seenWindows.has(windowBlock)) {
      return false;
    }
    seenWindows.add(windowBlock);
  }
  return true;
};

// Function to check if a time is within a given window
const isWithinWindow = (idealTime, windows) => {
  const [idealHour, idealMinute] = idealTime.split(':').map(Number);

  for (const window of windows) {
    const [startHour] = window.split(':').map(Number);
    const endHour = startHour + 2;

    if (
      (idealHour > startHour && idealHour < endHour) || // Within the 2-hour block
      (idealHour === startHour && idealMinute >= 0) // Exactly on the start time
    ) {
      return true;
    }
  }

  return false;
};

// Validation function for `administrationWindows`
const validateAdministrationWindows = (value, ctx, frequencyKey) => {
  // Check if array length equals the expected number of doses per day
  const expectedDosesPerDay = Math.ceil(ADMINISTRATION_FREQUENCY_DETAILS[frequencyKey].dosesPerDay);
  if (value.length !== expectedDosesPerDay) {
    return ctx.createError({
      message: `You must specify a number of ${expectedDosesPerDay} administration windows.`,
    });
  }

  // Validate each time format
  for (const time of value) {
    if (!isValidTimeWindowFormat(time)) {
      return ctx.createError({
        message: `Invalid time window format: ${time}. Must be in HH:00 format and has even hour between 00:00 and 22:00. E.g: 00:00, 02:00, ..., 22:00`,
      });
    }
  }

  // Ensure there are no duplicate 2-hour windows
  if (!hasUniqueTimeWindows(value)) {
    return ctx.createError({
      message:
        'Duplicate 2-hour time blocks are not allowed. Ensure all times represent unique 2-hour windows.',
    });
  }

  return true;
};

const validateAdministrationIdealTimes = (value, ctx, frequencyKey, windows) => {
  // Check if array length equals the expected number of doses per day
  const expectedDosesPerDay = Math.ceil(ADMINISTRATION_FREQUENCY_DETAILS[frequencyKey].dosesPerDay);
  if (value.length !== expectedDosesPerDay) {
    return ctx.createError({
      message: `You must specify a number of ${expectedDosesPerDay} administration windows.`,
    });
  }

  // Ensure there are no duplicate 2-hour windows
  if (!hasUniqueTimeWindows(value)) {
    return ctx.createError({
      message:
        'Duplicate 2-hour time blocks are not allowed. Ensure all times represent unique 2-hour windows.',
    });
  }

  // Validate each time format
  for (const time of value) {
    if (!isValidTimeFormat(time)) {
      return ctx.createError({
        message: `Invalid time format: ${time}. Times must be in HH:mm format.`,
      });
    }

    // Ensure each ideal time is within the provided administration windows
    if (!isWithinWindow(time, windows)) {
      return ctx.createError({
        message: `The time ${time} is not within the administration windows: [${windows.join(', ')}].`,
      });
    }
  }

  return true;
};

// Define the schema with modular validation
export const medicationFrequencySchema = (frequencyKey) =>
  yup.object({
    administrationWindows: yup
      .array(yup.string())
      .nullable()
      .test({
        name: 'validate-administration-windows',
        test(value, ctx) {
          return validateAdministrationWindows(value, ctx, frequencyKey);
        },
      }),
    administrationIdealTimes: yup
      .array(yup.string())
      .nullable()
      .test({
        name: 'validate-administration-ideal-times',
        test(value, ctx) {
          const { administrationWindows } = ctx.parent;
          if (!administrationWindows || !value) return true;
          return validateAdministrationIdealTimes(value, ctx, frequencyKey, administrationWindows);
        },
      }),
  });

export const medicationFrequencyDefault = Object.entries(ADMINISTRATION_FREQUENCY_DETAILS).reduce(
  (acc, [key, value]) => {
    acc[key] = {
      administrationWindows: value.startTimes,
      administrationIdealTimes: value.startTimes,
    };
    return acc;
  },
  {},
);
