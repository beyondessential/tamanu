import { FHIR_SEARCH_PARAMETERS, FHIR_SEARCH_TOKEN_TYPES } from '@tamanu/constants';

export const searchParameters = {
  identifier: {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['identifier', '[]']],
    tokenType: FHIR_SEARCH_TOKEN_TYPES.VALUE,
  },
  telecom: {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['telecom', '[]']],
    tokenType: FHIR_SEARCH_TOKEN_TYPES.VALUE,
  },
};
