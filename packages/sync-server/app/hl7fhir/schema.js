import * as yup from 'yup';
import { isArray } from 'lodash';

import { isValidIdentifier, getSortParameterName } from './utils';
import { hl7PatientFields, sortableHL7PatientFields } from './hl7PatientFields';

const MAX_RECORDS = 20;

// Explicitly set with the direction sign
const sortableHL7BaseFields = ['-issued', 'issued'];

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
      isValidIdentifier,
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
    .oneOf(sortableHL7BaseFields)
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
  const unknownParams = params.filter(param => param in patient.query.fields === false);
  return `Unknown or unsupported parameters: ${unknownParams.join(', ')}`;
}

// Generate schema dynamically because the parameters might include
// suffixes that modify the query. (parameter:suffix=value)
export const patient = {
  query: yup
    .object({
      ...getPatientParameters(),
      ...baseParameters,
      // Overwrite sort for patient resource
      _sort: yup
        .string()
        .test('is-supported-sort', 'Unsupported or unknown parameters in _sort', value => {
          // Sorts are separated by commas, no whitespace
          const sorts = value.split(',');
          // Faster to check if one is invalid
          const isInvalid = sorts.some(sort => {
            // Ignore base fields
            if (sortableHL7BaseFields.includes(sort)) return false;
            // Sort might have a "-" at the beginning, we should ignore it here
            const parameter = getSortParameterName(sort);
            return sortableHL7PatientFields.includes(parameter) === false;
          });
          return !isInvalid;
        })
        .default('-issued')
        .required(),
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
      // This will overwrite the validation in baseParameters for this field,
      // making it required for DiagnosticReport route.
      // Only kept for backwards compatibility.
      'subject:identifier': yup
        .string()
        .test(
          'is-correct-format-and-namespace',
          'subject:identifier must be in the format "<namespace>|<id>"',
          isValidIdentifier,
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
