import { FHIR_SEARCH_PARAMETERS, FHIR_SEARCH_TOKEN_TYPES } from '@tamanu/constants';

export const searchParameters = {
  identifier: {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['identifier', '[]']],
    tokenType: FHIR_SEARCH_TOKEN_TYPES.VALUE,
  },
  category: {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['category', '[]', 'coding', '[]']],
    tokenType: FHIR_SEARCH_TOKEN_TYPES.CODING,
  },
  intent: {
    type: FHIR_SEARCH_PARAMETERS.STRING,
    path: [['intent']],
  },
  occurrence: {
    type: FHIR_SEARCH_PARAMETERS.DATE,
    path: [['occurrenceDateTime']],
  },
  priority: {
    type: FHIR_SEARCH_PARAMETERS.STRING,
    path: [['priority']],
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
