import {
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_TOKEN_TYPES,
  FHIR_DATETIME_PRECISION,
} from '../../../constants';

export const searchParameters = {
  identifier: {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['identifier', '[]']],
    tokenType: FHIR_SEARCH_TOKEN_TYPES.VALUE,
  },
  given: {
    type: FHIR_SEARCH_PARAMETERS.STRING,
    path: [['name', '[]', 'given', '[]']],
  },
  family: {
    type: FHIR_SEARCH_PARAMETERS.STRING,
    path: [['name', '[]', 'family']],
  },
  gender: {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['gender']],
    sortable: false,
    tokenType: FHIR_SEARCH_TOKEN_TYPES.STRING,
  },
  birthdate: {
    type: FHIR_SEARCH_PARAMETERS.DATE,
    path: [['birthDate']],
    datePrecision: FHIR_DATETIME_PRECISION.DAYS,
  },
  address: {
    type: FHIR_SEARCH_PARAMETERS.STRING,
    path: [
      ['address', '[]', 'line', '[]'],
      ['address', '[]', 'city'],
      ['address', '[]', 'district'],
      ['address', '[]', 'state'],
      ['address', '[]', 'country'],
      ['address', '[]', 'postal_code'],
      ['address', '[]', 'text'],
    ],
  },
  'address-city': {
    type: FHIR_SEARCH_PARAMETERS.STRING,
    path: [['address', '[]', 'city']],
  },
  telecom: {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['telecom', '[]']],
    tokenType: FHIR_SEARCH_TOKEN_TYPES.VALUE,
  },
  deceased: {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['deceasedDateTime']],
    tokenType: FHIR_SEARCH_TOKEN_TYPES.PRESENCE,
  },
  active: {
    type: FHIR_SEARCH_PARAMETERS.TOKEN,
    path: [['active']],
    tokenType: FHIR_SEARCH_TOKEN_TYPES.BOOLEAN,
  },
  link: {
    type: FHIR_SEARCH_PARAMETERS.REFERENCE,
    path: [['link', '[]', 'other']],
    referenceTypes: ['Patient'],
  },
};
