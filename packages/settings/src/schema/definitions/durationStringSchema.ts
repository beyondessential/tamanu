import * as yup from 'yup';

/** Pattern from ms package. Use ms to parse these strings. */
const DURATION_PATTERN = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i;

export const durationStringSchema = (propertyName: string) =>
  yup
    .string()
    .matches(DURATION_PATTERN, `‘${propertyName}’ should be in minutes (min) or hours (h)`);
