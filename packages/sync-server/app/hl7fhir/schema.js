import * as yup from 'yup';
import config from 'config';
import { isArray } from 'lodash';

import { decodeIdentifier, hl7PatientFields } from './utils';

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

// Returns an object with patient parameters as keys
// and yup validation schema for each field as values.
const getPatientParameters = () => {
  const parameters = {};

  Object.entries(hl7PatientFields).forEach(([paramName, paramConfig]) => {
    const { supportedModifiers = [], validationSchema } = paramConfig;

    if (!validationSchema) {
      throw new Error(`The key ${paramName} from hl7PatientFields needs a validationSchema key.`);
    }

    // Add the parameter without suffix
    parameters[paramName] = validationSchema;

    // Add the paramater with all the supported modifiers
    supportedModifiers.forEach(modifier => {
      const suffixedName = `${paramName}:${modifier}`;
      parameters[suffixedName] = validationSchema;
    });
  });

  return parameters;
};

// Custom function for yup's noUnknown error message
function noUnknownValidationMessage(obj) {
  // Get all params from the object being validated
  const params = Object.keys(obj.originalValue);

  // Return list of unknown params
  const unknownParams = params.filter(param => param in patient.fields === false);
  return `Unknown or unsupported parameters: ${unknownParams.join(', ')}`;
}

// Generate schema dynamically because the parameters might include
// suffixes that modify the query. (parameter:suffix=value)
export const patient = {
  query: yup
    .object({
      ...getPatientParameters(),
      ...baseParameters,
    })
    .noUnknown(true, noUnknownValidationMessage),
};

export const DIAGNOSTIC_REPORT_INCLUDES = {
  RESULT: 'DiagnosticReport:result',
  DEVICE: 'DiagnosticReport:result.device:Device',
};

export const diagnosticReport = {
  query: yup
    .object({
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
    })
    .noUnknown(true, noUnknownValidationMessage),
};
