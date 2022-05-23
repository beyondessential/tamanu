import * as yup from 'yup';
import moment from 'moment';

import { hl7ParameterTypes, stringTypeModifiers } from './hl7Parameters';

// HL7 Patient resource mapping to Tamanu.
// (only supported params are in)
export const hl7PatientFields = {
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
        // Only these formats should be valid for a date in HL7 FHIR:
        // https://www.hl7.org/fhir/datatypes.html#date
        return moment(value, ['YYYY', 'YYYY-MM', 'YYYY-MM-DD'], true).isValid();
      }),
    sortable: true,
  },
  // TODO: address should match a bunch of other fields
  address: {
    parameterType: hl7ParameterTypes.string,
    fieldName: 'additionalData.cityTown',
    columnName: 'additionalData.city_town',
    supportedModifiers: stringTypeModifiers,
    validationSchema: yup.string(),
    sortable: true,
  },
  'address-city': {
    parameterType: hl7ParameterTypes.string,
    fieldName: 'additionalData.cityTown',
    columnName: 'additionalData.city_town',
    supportedModifiers: stringTypeModifiers,
    validationSchema: yup.string(),
    sortable: true,
  },
  // TODO: telecom could also be email or other phones
  telecom: {
    parameterType: hl7ParameterTypes.token,
    fieldName: '$additionalData.primary_contact_number$',
    columnName: 'additionalData.primary_contact_number',
    supportedModifiers: [],
    validationSchema: yup.string(),
    sortable: true,
  },
};

export const sortableHL7PatientFields = Object.keys(hl7PatientFields).filter(
  field => hl7PatientFields[field].sortable,
);
