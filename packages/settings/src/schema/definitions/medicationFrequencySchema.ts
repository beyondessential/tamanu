import * as yup from 'yup';
import { ADMINISTRATION_FREQUENCY_DETAILS } from '@tamanu/constants';

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
    const windowBlock = Math.floor(parseInt(time.split(':')[0], 10) / 2); // Unique key for 2-hour blocks

    if (seenWindows.has(windowBlock)) {
      return false;
    }
    seenWindows.add(windowBlock);
  }

  return true;
};

const validateAdministrationIdealTimes = (value, ctx, frequencyKey) => {
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
  }

  return true;
};

// Define the schema with modular validation
export const medicationFrequencySchema = (frequencyKey) =>
  yup
    .array(yup.string())
    .nullable()
    .test({
      name: 'validate-administration-ideal-times',
      test(value, ctx) {
        if (!value) return true;
        return validateAdministrationIdealTimes(value, ctx, frequencyKey);
      },
    });

export const medicationFrequencyDefault = Object.entries(ADMINISTRATION_FREQUENCY_DETAILS).reduce(
  (acc, [key, value]) => {
    acc[key] = value.startTimes;
    return acc;
  },
  {},
);
