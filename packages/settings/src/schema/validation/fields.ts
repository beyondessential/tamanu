import * as yup from 'yup';

const hideable = {
  hidden: {
    description: 'Field should not display on forms',
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
    description: 'Field must be filled out when creating a patient',
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
    description: 'Regex to enforce the format of field input',
    schema: yup.string(),
    defaultValue: '[\\s\\S]*',
  },
};
