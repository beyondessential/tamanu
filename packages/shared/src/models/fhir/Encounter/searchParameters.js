import {
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_TOKEN_TYPES,
  FHIR_DATETIME_PRECISION,
} from '@tamanu/constants';

export const searchParameters = {
  class: {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['class', '[]', 'coding', '[]']],
    tokenType: FHIR_SEARCH_TOKEN_TYPES.CODING,
  },
  'date-start': {
    type: FHIR_SEARCH_PARAMETERS.DATE,
    path: [['actualPeriod', 'start']],
    datePrecision: FHIR_DATETIME_PRECISION.DAYS,
  },
  'end-date': {
    type: FHIR_SEARCH_PARAMETERS.DATE,
    path: [['actualPeriod', 'end']],
    datePrecision: FHIR_DATETIME_PRECISION.DAYS,
  },
  status: {
    type: FHIR_SEARCH_PARAMETERS.STRING,
    path: [['status']],
  },
  subject: {
    type: FHIR_SEARCH_PARAMETERS.REFERENCE,
    path: [['subject']],
    referenceTypes: ['Patient'],
  },
};
