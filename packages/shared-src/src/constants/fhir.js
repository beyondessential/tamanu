import { Op } from 'sequelize';

// When adding to this:
// - add the migration for the fhir.Name resource table
//   - don't forget the trigger to update the version_id and add to versioning
// - add the migration for the versioning table:
//   - the fhir.resource_enum type
//   - the fhir.resource_type enum
//
// must be in dependency order
export const FHIR_RESOURCE_TYPES = ['Patient', 'Practitioner', 'ServiceRequest'];

// All possible search parameter types
export const FHIR_SEARCH_PARAMETERS = {
  NUMBER: 'number',
  DATE: 'date',
  STRING: 'string',
  TOKEN: 'token',
  REFERENCE: 'reference',
  COMPOSITE: 'composite',
  QUANTITY: 'quantity',
  URI: 'uri',
  SPECIAL: 'special',
};

// All supported search modifiers, by parameter type,
// mapped to their Sequelize operator, or to a function
// (param) => Sequelize.where/.or/.and...
export const FHIR_SEARCH_MODIFIERS = {
  [FHIR_SEARCH_PARAMETERS.URI]: {
    // above
    // below
  },
  [FHIR_SEARCH_PARAMETERS.STRING]: {
    exact: Op.eq,
    contains: Op.substring,
    'starts-with': Op.startsWith,
    'ends-with': Op.endsWith,
    // text
  },
  [FHIR_SEARCH_PARAMETERS.TOKEN]: {
    // text
    // not
    // above
    // below
    // in
    // not-in
    // of-type
  },
  [FHIR_SEARCH_PARAMETERS.REFERENCE]: {
    // {type}
    // identifier
    // above
    // below
  },
};

// All supported search prefixes (for number, date, quantity)
export const FHIR_SEARCH_PREFIXES = {
  EQ: 'eq',
  NE: 'ne',
  GT: 'gt',
  LT: 'lt',
  GE: 'ge',
  LE: 'le',
  // SA: 'sa',
  // EB: 'eb',
  // AP: 'ap',
};

export const FHIR_PATIENT_LINK_TYPES = {
  REPLACES: 'replaces',
  REPLACED_BY: 'replaced-by',
  SEE_ALSO: 'seealso',
};
