export const FHIR_INTERACTIONS = {
  INSTANCE: {
    READ: 'resource-read',
    VREAD: 'resource-vread',
    UPDATE: 'resource-update', // and patch
    DELETE: 'resource-delete',
    HISTORY: 'resource-history',
  },
  TYPE: {
    CREATE: 'type-create',
    SEARCH: 'type-search',
    HISTORY: 'type-history',
  },
  SYSTEM: {
    CAPABILITIES: 'capabilities',
    TRANSACTION: 'transaction', // and batch
    HISTORY: 'system-history',
    SEARCH: 'system-search',
  },
  INTERNAL: {
    MATERIALISE: 'materialise',
  },
};

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

export const FHIR_SEARCH_TOKEN_TYPES = {
  VALUE: 'value',
  CODING: 'coding',
  STRING: 'string',
  BOOLEAN: 'boolean',
  PRESENCE: 'presence',
};

// All supported search modifiers, by parameter type,
// mapped to their Sequelize operator, or to a function
// (param) => Sequelize.where/.or/.and...
// not used in code, but kept for reference
// export const FHIR_SEARCH_MODIFIERS = {
//   [FHIR_SEARCH_PARAMETERS.URI]: {
//     // above
//     // below
//   },
//   [FHIR_SEARCH_PARAMETERS.STRING]: {
//     exact: Op.eq,
//     contains: Op.substring,
//     'starts-with': Op.startsWith,
//     'ends-with': Op.endsWith,
//     // text
//   },
//   [FHIR_SEARCH_PARAMETERS.TOKEN]: {
//     // text
//     // not
//     // above
//     // below
//     // in
//     // not-in
//     // of-type
//   },
//   [FHIR_SEARCH_PARAMETERS.REFERENCE]: {
//     // {type}
//     // identifier
//     // above
//     // below
//   },
// };

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

export const FHIR_RESOURCE_TYPES = {
  BUNDLE: 'Bundle',
  COMPOSITION: 'Composition',
  PATIENT: 'Patient',
  MEDICATION_STATEMENT: 'MedicationStatement',
  ALLERGY_INTOLERANCE: 'AllergyIntolerance',
  CONDITION: 'Condition',
  IMMUNIZATION: 'Immunization',
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

export const FHIR_REQUEST_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ON_HOLD: 'on-hold',
  REVOKED: 'revoked',
  COMPLETED: 'completed',
  ENTERED_IN_ERROR: 'entered-in-error',
  UNKNOWN: 'unknown',
};

export const FHIR_REQUEST_INTENT = {
  PROPOSAL: 'proposal',
  PLAN: 'plan',
  DIRECTIVE: 'directive',
  ORDER: {
    _: 'order',
    ORIGINAL: 'original-order',
    REFLEX: 'reflex-order',
    FILLER: {
      _: 'filler-order',
      INSTANCE: 'instance-order',
    },
  },
  OPTION: 'option',
};

export const FHIR_REQUEST_PRIORITY = {
  ROUTINE: 'routine',
  URGENT: 'urgent',
  ASAP: 'asap',
  STAT: 'stat',
};

export const FHIR_DIAGNOSTIC_REPORT_STATUS = {
  REGISTERED: 'registered',
  PARTIAL: {
    _: 'partial',
    PRELIMINARY: 'preliminary',
    MODIFIED: 'modified',
  },
  FINAL: 'final',
  AMENDED: {
    _: 'amended',
    CORRECTED: 'corrected',
    APPENDED: 'appended',
  },
  CANCELLED: 'cancelled',
  ENTERED_IN_ERROR: 'entered-in-error',
  UNKNOWN: 'unknown',
};

export const FHIR_IMAGING_STUDY_STATUS = {
  REGISTERED: 'registered',
  AVAILABLE: 'available',
  FINAL_INVALID_LEGACY: 'final', // this needs to be supported but is not valid FHIR
  CANCELLED: 'cancelled',
  ENTERED_IN_ERROR: 'entered-in-error',
  UNKNOWN: 'unknown',
};

export const FHIR_OBSERVATION_STATUS = {
  REGISTERED: 'registered',
  PRELIMINARY: 'preliminary',
  FINAL: 'final',
  AMENDED: 'amended',
};

export const FHIR_ENCOUNTER_CLASS_DISPLAY = {
  IMP: 'inpatient encounter',
  AMB: 'ambulatory encounter',
  OBSENC: 'observation encounter',
  EMER: 'emergency',
  HH: 'home health',
  VR: 'virtual',
};

export const FHIR_ENCOUNTER_CLASS_CODE = Object.fromEntries(
  Object.keys(FHIR_ENCOUNTER_CLASS_DISPLAY).map(k => [k, k]),
);

export const FHIR_ENCOUNTER_STATUS = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in-progress',
  ON_HOLD: 'on-hold',
  DISCHARGED: 'discharged',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISCONTINUED: 'discontinued',
  ENTERED_IN_ERROR: 'entered-in-error',
  UNKNOWN: 'unknown',
};

export const FHIR_ENCOUNTER_LOCATION_STATUS = {
  PLANNED: 'planned',
  ACTIVE: 'active',
  RESERVED: 'reserved',
  COMPLETED: 'completed',
};

// see http://terminology.hl7.org/CodeSystem/location-physical-type
export const FHIR_LOCATION_PHYSICAL_TYPE_CODE = {
  SITE: 'si',
  BUILDING: 'bu',
  WING: 'wi',
  WARD: 'wa',
  LEVEL: 'lvl',
  CORRIDOR: 'co',
  ROOM: 'ro',
  BED: 'bd',
  VEHICLE: 've',
  HOUSE: 'ho',
  CABINET: 'ca',
  ROAD: 'rd',
  AREA: 'area',
  JURISDICTION: 'jdn',
  VIRTUAL: 'vi',
};

export const FHIR_LOCATION_PHYSICAL_TYPE_DISPLAY = Object.fromEntries(
  Object.entries(FHIR_LOCATION_PHYSICAL_TYPE_CODE).map(([k, v]) => [
    v,
    `${k.substring(0, 1).toUpperCase()}${k.substring(1).toLowerCase()}`,
  ]),
);

export const IPS_REQUEST_STATUSES = {
  QUEUED: 'Queued',
  PROCESSED: 'Processed',
  ERROR: 'Error',
  IGNORE: 'Ignore',
};

export const HTTP_BODY_DATA_PATHS = {
  DIAGNOSTIC_REPORT_ATTACHMENT: '$.presentedForm[*].data',
};

export const SCRUBBED_DATA_MESSAGE = 'Raw data removed from logs';
export const SUPPORTED_CONTENT_TYPES = {
  PDF: 'application/pdf',
};
export const DEFAULT_REASON_CANCELLED_BY_API = 'cancelled externally via api';
