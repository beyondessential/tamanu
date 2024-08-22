import * as yup from 'yup';

const hideable = {
  hidden: {
    description: 'Field should be hidden',
    schema: yup.boolean(),
    defaultValue: false,
  },
};

export const baseFieldSchema = {
  defaultValue: {
    description: 'Default value for field',
    schema: yup.mixed(),
    defaultValue: null,
  },
  required: {
    description: 'Field is required',
    schema: yup.boolean(),
    defaultValue: false,
  },
};

export const hideableFieldSchema = {
  ...baseFieldSchema,
  ...hideable,
};

export const patientDetailsFieldSchema = {
  ...baseFieldSchema,
  requiredPatientData: {
    description: 'Field is required for patient data',
    schema: yup.boolean(),
    defaultValue: false,
  },
};

export const hideablePatientFieldSchema = {
  ...patientDetailsFieldSchema,
  ...hideable,
};

export const displayIdFieldSchema = {
  ...baseFieldSchema,
  pattern: {
    description: 'Regex pattern for display ID',
    schema: yup.string(),
    defaultValue: '[\\s\\S]*',
  },
};
