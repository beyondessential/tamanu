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
    fieldName: 'displayId',
    columnName: 'display_id',
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
    fieldName: 'firstName',
    columnName: 'first_name',
    supportedModifiers: stringTypeModifiers,
    validationSchema: yup.string(),
    sortable: true,
  },
  family: {
    parameterType: hl7ParameterTypes.string,
    fieldName: 'lastName',
    columnName: 'last_name',
    supportedModifiers: stringTypeModifiers,
    validationSchema: yup.string(),
    sortable: true,
  },
  gender: {
    parameterType: hl7ParameterTypes.token,
    fieldName: 'sex',
    columnName: 'sex',
    supportedModifiers: [],
    validationSchema: yup.string().oneOf(['male', 'female', 'other']),
    sortable: false,
  },
  birthdate: {
    parameterType: hl7ParameterTypes.date,
    fieldName: 'dateOfBirth',
    columnName: 'date_of_birth',
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
    fieldName: '$additionalData.city_town$',
    columnName: 'additionalData.city_town',
    supportedModifiers: stringTypeModifiers,
    validationSchema: yup.string(),
    sortable: true,
    sortArguments: ['additionalData', 'cityTown'],
  },
  'address-city': {
    parameterType: hl7ParameterTypes.string,
    fieldName: '$additionalData.city_town$',
    columnName: 'additionalData.city_town',
    supportedModifiers: stringTypeModifiers,
    validationSchema: yup.string(),
    sortable: true,
    sortArguments: ['additionalData', 'cityTown'],
  },
  // TODO: telecom could also be email or other phones
  telecom: {
    parameterType: hl7ParameterTypes.token,
    fieldName: '$additionalData.primary_contact_number$',
    columnName: 'additionalData.primary_contact_number',
    supportedModifiers: [],
    validationSchema: yup.string(),
    sortable: true,
    sortArguments: ['additionalData', 'primaryContactNumber'],
  },
  deceased: {
    parameterType: hl7ParameterTypes.token,
    fieldName: 'dateOfDeath',
    columnName: 'date_of_death',
    supportedModifiers: [],
    validationSchema: yup.string().oneOf(['true', 'false']),
    getValue: () => null,
    getOperator: value => {
      if (value === 'true') {
        return Op.not;
      }
      if (value === 'false') {
        return Op.is;
      }
      throw new InvalidParameterError(`Invalid value for deceased parameter: ${value}`);
    },
  },
  active: {
    parameterType: hl7ParameterTypes.token,
    fieldName: 'visibilityStatus',
    columnName: 'visibility_status',
    supportedModifiers: [],
    validationSchema: yup.string().oneOf(['true', 'false']),
    getValue: () => VISIBILITY_STATUSES.CURRENT,
    getOperator: value => {
      if (value === 'true') {
        return Op.eq;
      }
      if (value === 'false') {
        return Op.ne;
      }
      throw new InvalidParameterError(`Invalid value for active parameter: ${value}`);
    },
  },
};

export const sortableHL7PatientFields = Object.keys(hl7PatientFields).filter(
  field => hl7PatientFields[field].sortable,
);
