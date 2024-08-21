import * as yup from 'yup';

export const patientDetailsFieldSchema = {
  requiredPatientData: {
    description: 'Field is required for patient data',
    schema: yup.boolean(),
    default: false,
  },
  defaultValue: {
    description: 'Default value for field',
    schema: yup.string(),
    default: null,
  },
};

export const hideablePatientFieldSchema = {
  hidden: {
    description: 'Field should be hidden',
    schema: yup.boolean(),
    default: false,
  },
  ...patientDetailsFieldSchema,
};
