import { Op } from 'sequelize';

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

// Modifiers supported by Tamanu with the corresponding
// sequelize operator. Classified by HL7 search parameter type.
// The LIKE modifiers' patterns are built by getQueryObject.
export const modifiers = {
  [hl7ParameterTypes.string]: {
    contains: Op.like,
    'starts-with': Op.like,
    'ends-with': Op.like,
    exact: Op.eq,
  },
};

export const stringTypeModifiers = Object.keys(modifiers.string);
