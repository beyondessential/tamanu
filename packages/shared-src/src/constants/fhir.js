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
  COMPOSITE: 'composite', // not supported yet
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

export const FHIR_MAX_RESOURCES_PER_PAGE = 20;

export const FHIR_DATETIME_PRECISION = {
  SECONDS_WITH_TIMEZONE: 's+tz',
  MINUTES_WITH_TIMEZONE: 'm+tz',
  HOURS_WITH_TIMEZONE: 'h+tz',
  SECONDS: 's',
  MINUTES: 'm',
  HOURS: 'h',
  DAYS: 'D',
  MONTHS: 'M',
  YEARS: 'Y',
};

export const FHIR_BUNDLE_TYPES = {
  DOCUMENT: 'document',
  MESSAGE: 'message',
  TRANSACTION: 'transaction',
  TRANSACTION_RESPONSE: 'transaction-response',
  BATCH: 'batch',
  BATCH_RESPONSE: 'batch-response',
  HISTORY: 'history',
  SEARCHSET: 'searchset',
  COLLECTION: 'collection',
};

export const FHIR_ISSUE_SEVERITY = {
  INFORMATION: 'information',
  WARNING: 'warning',
  ERROR: 'error',
  FATAL: 'fatal',
};

export const FHIR_ISSUE_TYPE = {
  INVALID: {
    _: 'invalid',
    STRUCTURE: 'structure',
    REQUIRED: 'required',
    VALUE: 'value',
    INVARIANT: 'invariant',
  },
  SECURITY: {
    _: 'security',
    LOGIN: 'login',
    UNKNOWN: 'unknown',
    EXPIRED: 'expired',
    FORBIDDEN: 'forbidden',
    SUPPRESSED: 'suppressed',
  },
  PROCESSING: {
    _: 'processing',
    NOT_SUPPORTED: 'not-supported',
    DUPLICATE: 'duplicate',
    MULTIPLE_MATCHES: 'multiple-matches',
    NOT_FOUND: {
      _: 'not-found',
      DELETED: 'deleted',
    },
    TOO_LONG: 'too-long',
    CODE_INVALID: 'code-invalid',
    EXTENSION: 'extension',
    TOO_COSTLY: 'too-costly',
    BUSINESS_RULE: 'business-rule',
    CONFLICT: 'conflict',
  },
  TRANSIENT: {
    _: 'transient',
    LOCK_ERROR: 'lock-error',
    NO_STORE: 'no-store',
    EXCEPTION: 'exception',
    TIMEOUT: 'timeout',
    INCOMPLETE: 'incomplete',
    THROTTLED: 'throttled',
  },
  INFORMATIONAL: 'informational',
};
