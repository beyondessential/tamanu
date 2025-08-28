import { FHIR_SEARCH_PARAMETERS, FHIR_SEARCH_TOKEN_TYPES } from '@tamanu/constants';

export const searchParameters = {
  identifier: {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['identifier', '[]']],
    tokenType: FHIR_SEARCH_TOKEN_TYPES.VALUE,
  },
  groupIdentifier: {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['groupIdentifier', '[]']],
    tokenType: FHIR_SEARCH_TOKEN_TYPES.VALUE,
  },
  category: {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['category', 'coding', '[]']],
    tokenType: FHIR_SEARCH_TOKEN_TYPES.CODING,
  },
  intent: {
    type: FHIR_SEARCH_PARAMETERS.STRING,
    path: [['intent']],
  },
  authoredOn: {
    type: FHIR_SEARCH_PARAMETERS.DATE,
    path: [['authoredOn']],
  },
  status: {
    type: FHIR_SEARCH_PARAMETERS.STRING,
    path: [['status']],
  },
  medication: {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['medication', 'coding', '[]']],
    tokenType: FHIR_SEARCH_TOKEN_TYPES.CODING,
  },
  subject: {
    type: FHIR_SEARCH_PARAMETERS.REFERENCE,
    path: [['subject']],
    referenceTypes: ['Patient'],
  },
  encounter: {
    type: FHIR_SEARCH_PARAMETERS.REFERENCE,
    path: [['encounter']],
    referenceTypes: ['Encounter'],
  },
  requester: {
    type: FHIR_SEARCH_PARAMETERS.REFERENCE,
    path: [['requester']],
    referenceTypes: ['Organization'],
  },
  recorder: {
    type: FHIR_SEARCH_PARAMETERS.REFERENCE,
    path: [['recorder']],
    referenceTypes: ['Practitioner'],
  },
};
