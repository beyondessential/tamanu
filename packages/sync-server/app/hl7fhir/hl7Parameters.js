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
export const modifiers = {
  [hl7ParameterTypes.string]: {
    contains: Op.substring,
    'starts-with': Op.startsWith,
    'ends-with': Op.endsWith,
    exact: Op.eq,
  },
};

export const stringTypeModifiers = Object.keys(modifiers.string);
