import { Op } from 'sequelize';
import { likePattern } from '@tamanu/utils/likePattern';

// Prefixes supported by Tamanu with the corresponding
// sequelize operators.
/*
const prefixes = {
  eq: Op.eq,
  co: Op.substring,
  sw: Op.startsWith,
  ew: Op.endsWith,
};
*/

// All of the HL7 search parameter types
export const hl7ParameterTypes = /** @type {const} */ ({
  number: 'number',
  date: 'date',
  string: 'string',
  token: 'token',
  reference: 'reference',
  composite: 'composite',
  quantity: 'quantity',
  uri: 'uri',
  special: 'special',
});

// LIKE patterns for the string modifiers that match part of a value. likePattern escapes the value
// so its own `%`, `_` and `\` are matched literally rather than read as wildcards.
export const stringSearchPatterns = /** @type {const} */ ({
  contains: value => likePattern`%${value}%`,
  'starts-with': value => likePattern`${value}%`,
  'ends-with': value => likePattern`%${value}`,
});

// Modifiers supported by Tamanu with the corresponding
// sequelize operator. Classified by HL7 search parameter type.
export const modifiers = /** @type {const} */ ({
  [hl7ParameterTypes.string]: {
    // Each of these takes its pattern from stringSearchPatterns
    contains: Op.like,
    'starts-with': Op.like,
    'ends-with': Op.like,
    exact: Op.eq,
  },
});

export const stringTypeModifiers = Object.keys(modifiers.string);
