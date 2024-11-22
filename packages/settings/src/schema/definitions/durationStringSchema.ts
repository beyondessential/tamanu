import * as yup from 'yup';

/**
 * Adapted ms package. Use ms to parse these strings. This pattern represents a strict subset of
 * strings accepted by ms. Note that this pattern stipulates that a unit MUST be included.
 */
const DURATION_PATTERN = /^(-?(?:\d+)?\.?\d+) *(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h)$/i;

export const durationStringSchema = (propertyName: string) =>
  yup
    .string()
    .matches(DURATION_PATTERN, `‘${propertyName}’ should be in minutes (min) or hours (h)`);
