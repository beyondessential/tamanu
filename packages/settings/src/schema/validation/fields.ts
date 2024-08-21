import * as yup from 'yup';

export const baseFieldSchema = {
  defaultValue: {
    description: 'Default value for field',
    schema: yup.mixed(),
    default: '',
  },
};

const hiddenSchema = {
  description: 'Field should be hidden',
  schema: yup.boolean(),
  default: false,
};

export const hideableFieldSchema = {
  ...baseFieldSchema,
  hidden: hiddenSchema,
};

export const patientDetailsFieldSchema = {
  ...baseFieldSchema,
  requiredPatientData: {
    description: 'Field is required for patient data',
    schema: yup.boolean(),
    default: false,
  },
};

export const hideablePatientFieldSchema = {
  ...patientDetailsFieldSchema,
  hidden: hiddenSchema,
};

export const displayIdFieldSchema = {
  ...patientDetailsFieldSchema,
  pattern: {
    description: 'Regex pattern for display ID',
    schema: yup.string(),
    default: '[\\s\\S]*',
  },
};
