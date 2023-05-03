import { FHIR_SEARCH_PARAMETERS, FHIR_SEARCH_TOKEN_TYPES } from '../../../constants/fhir';

export const searchParameters = {
  patient: {
    type: FHIR_SEARCH_PARAMETERS.REFERENCE,
    path: [['patient']],
    referenceTypes: ['Patient'],
  },
  'vaccine-code': {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['vaccineCode', 'coding', '[]']],
    tokenType: FHIR_SEARCH_TOKEN_TYPES.CODING,
  },
};
