import { Op } from 'sequelize';
import { InvalidParameterError } from 'shared/errors';
import * as yup from 'yup';

import { VISIBILITY_STATUSES } from 'shared/constants';
import { hl7ParameterTypes, stringTypeModifiers } from './hl7Parameters';

// Import directly from file instead of index to avoid dependency cycle
import { isValidIdentifier, decodeIdentifier } from './utils/identifier';
import { parseHL7Date } from './utils/search';

// HL7 Patient resource mapping to Tamanu.
// (only supported params are in)
export const hl7PatientFields = {
  identifier: {
    parameterType: hl7ParameterTypes.token,
    path: 'identifier[].value',
    supportedModifiers: [],
    validationSchema: yup
      .string()
      .test(
        'is-correct-format-and-namespace',
        'identifier must be in the format "<namespace>|<id>"',
        isValidIdentifier,
      ),
    getValue: value => {
      const [, identifier] = decodeIdentifier(value);
      return identifier;
    },
  },
  given: {
    parameterType: hl7ParameterTypes.string,
    path: 'name[].given[]',
    supportedModifiers: stringTypeModifiers,
    validationSchema: yup.string(),
    sortable: true,
  },
  family: {
    parameterType: hl7ParameterTypes.string,
    path: 'name[].family',
    supportedModifiers: stringTypeModifiers,
    validationSchema: yup.string(),
    sortable: true,
  },
  gender: {
    parameterType: hl7ParameterTypes.token,
    path: 'gender',
    supportedModifiers: [],
    validationSchema: yup.string().oneOf(['male', 'female', 'other']),
    sortable: false,
  },
  birthdate: {
    parameterType: hl7ParameterTypes.date,
    path: 'birthDate',
    supportedModifiers: [],
    validationSchema: yup
      .string()
      // eslint-disable-next-line no-template-curly-in-string
      .test('is-valid-date', 'Invalid date/time format: ${value}', value => {
        if (!value) return true;
        return parseHL7Date(value).isValid();
      }),
    sortable: true,
  },
  // TODO: address should match a bunch of other fields
  address: {
    parameterType: hl7ParameterTypes.string,
    path: [
      'address[].line[]',
      'address[].city',
      'address[].district',
      'address[].state',
      'address[].country',
      'address[].postalCode',
      'address[].text',
    ],
    supportedModifiers: stringTypeModifiers,
    validationSchema: yup.string(),
    sortable: true,
  },
  'address-city': {
    parameterType: hl7ParameterTypes.string,
    path: 'address[].city',
    supportedModifiers: stringTypeModifiers,
    validationSchema: yup.string(),
    sortable: true,
  },
  telecom: {
    parameterType: hl7ParameterTypes.token,
    path: 'telecom[].value',
    supportedModifiers: [],
    validationSchema: yup.string(),
    sortable: true,
  },
  deceased: {
    parameterType: hl7ParameterTypes.token,
    path: 'deceasedDateTime',
    supportedModifiers: [],
    validationSchema: yup.boolean(),
    getValue: () => null,
    getOperator: value => value ? Op.not : Op.is,
  },
  active: {
    parameterType: hl7ParameterTypes.token,
    path: 'active',
    supportedModifiers: [],
    validationSchema: yup.boolean(),
  },
};

export const sortableHL7PatientFields = Object.keys(hl7PatientFields).filter(
  field => hl7PatientFields[field].sortable,
);
