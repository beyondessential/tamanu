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
export const hl7ParameterTypes = {
  number: 'number',
  date: 'date',
  string: 'string',
  token: 'token',
  reference: 'reference',
  composite: 'composite',
  quantity: 'quantity',
  uri: 'uri',
  special: 'special',
};

// LIKE patterns for the string modifiers that match part of a value, matching the value literally
export const stringSearchPatterns = {
  contains: value => likePattern`%${value}%`,
  'starts-with': value => likePattern`${value}%`,
  'ends-with': value => likePattern`%${value}`,
};

// Modifiers supported by Tamanu with the corresponding
// sequelize operator. Classified by HL7 search parameter type.
export const modifiers = {
  [hl7ParameterTypes.string]: {
    ...Object.fromEntries(Object.keys(stringSearchPatterns).map(modifier => [modifier, Op.like])),
    exact: Op.eq,
  },
};

export const stringTypeModifiers = Object.keys(modifiers.string);
