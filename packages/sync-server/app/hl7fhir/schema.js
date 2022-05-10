import * as yup from 'yup';
import config from 'config';
import { isArray } from 'lodash';
import moment from 'moment';

import { decodeIdentifier, getParamAndModifier } from './utils';

export const IDENTIFIER_NAMESPACE = config.hl7.dataDictionaries.patientDisplayId;
const MAX_RECORDS = 20;

// List of all the fixed name parameters that we support
const baseParameters = {
  // TODO: remove subject:identifier after the fiji VPS is good without it.
  // Patients don't have a subject parameter,
  // this is just for backwards compatibility.
  'subject:identifier': yup
    .string()
    .test(
      'is-correct-format-and-namespace',
      'subject:identifier must be in the format "<namespace>|<id>"',
      value => {
        if (!value) return true;
        const [namespace, displayId] = decodeIdentifier(value);
        return namespace === IDENTIFIER_NAMESPACE && !!displayId;
      },
    ),
  _count: yup
    .number()
    .integer()
    .min(1)
    .max(MAX_RECORDS)
    .default(MAX_RECORDS)
    .required(),
  _page: yup
    .number()
    .integer()
    .min(0)
    .default(0)
    .required(),
  _sort: yup
    .string()
    .oneOf(['-issued'])
    .default('-issued')
    .required(),
  after: yup
    .object({
      id: yup.string().required(),
      createdAt: yup.date().required(),
    })
    .nullable()
    .default(null),
  // TODO: remove status after the fiji VPS is good without it.
  // Patients don't have a status parameter,
  // this is just for backwards compatibility.
  status: yup.string(),
};

const patientParameters = {
  given: yup.string(),
  family: yup.string(),
  gender: yup.string().oneOf(['male', 'female', 'other']),
  // eslint-disable-next-line no-template-curly-in-string
  birthdate: yup.string().test('is-valid-date', 'Invalid date/time format: ${value}', value => {
    // Only these formats should be valid for a date in HL7 FHIR:
    // https://www.hl7.org/fhir/datatypes.html#date
    return moment(value, ['YYYY', 'YYYY-MM', 'YYYY-MM-DD'], true).isValid();
  }),
  address: yup.string(),
  'address-city': yup.string(),
  telecom: yup.string(),
};

// Yup schema that will match any type but will fail to validate.
// Useful for rejecting params with a more meaningful error message.
const errorSchema = yup
  .mixed()
  // eslint-disable-next-line no-template-curly-in-string
  .test('no-test-force-error', 'Parameter ${path} is unknown or not supported.', () => false);

// Returns an object with patient parameters found in the query
// as keys and yup validation schema for each field as values.
const getPatientParameters = queryParams => {
  const parameters = {};

  Object.keys(queryParams).forEach(key => {
    if (key in baseParameters === false) {
      // Parse parameter only
      const [param] = getParamAndModifier(key);

      // Assign known parameter validation or use a schema that will fail
      parameters[key] = patientParameters[param] || errorSchema;
    }
  });

  return parameters;
};

// Use lazy evaluation because the parameters might include
// suffixes that modify the query. (parameter:suffix=value)
export const patient = {
  query: yup.lazy(params =>
    yup.object({
      ...getPatientParameters(params),
      ...baseParameters,
    }),
  ),
};

export const DIAGNOSTIC_REPORT_INCLUDES = {
  RESULT: 'DiagnosticReport:result',
  DEVICE: 'DiagnosticReport:result.device:Device',
};

export const diagnosticReport = {
  query: yup.object({
    ...baseParameters,
    // This will overwrite the sharedQuery validation for this field,
    // making it required for DiagnosticReport route.
    // Only kept for backwards compatibility.
    'subject:identifier': yup
      .string()
      .test(
        'is-correct-format-and-namespace',
        'subject:identifier must be in the format "<namespace>|<id>"',
        value => {
          const [namespace, displayId] = decodeIdentifier(value);
          return namespace === IDENTIFIER_NAMESPACE && !!displayId;
        },
      )
      .required(),
    _include: yup
      .array()
      .of(yup.string().oneOf(Object.values(DIAGNOSTIC_REPORT_INCLUDES)))
      .transform((_, originalValue) => {
        if (isArray(originalValue)) {
          return originalValue;
        }
        return [originalValue];
      }),
    status: yup.string().oneOf(['final']),
  }),
};
