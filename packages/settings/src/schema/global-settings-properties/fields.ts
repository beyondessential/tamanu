import * as yup from 'yup';

const hideable = {
  hidden: {
    description: 'Field should not display on forms',
    schema: yup.boolean(),
    defaultValue: false,
  },
};

export const baseFieldProperties = {
  defaultValue: {
    description: 'Default value for field',
    Properties: yup.mixed(),
    defaultValue: null,
  },
  required: {
    description: 'Field is required',
    Properties: yup.boolean(),
    defaultValue: false,
  },
};

export const hideableFieldProperties = {
  ...baseFieldProperties,
  ...hideable,
};

export const patientDetailsFieldProperties = {
  ...baseFieldProperties,
  requiredPatientData: {
    description: 'Field must be filled out when creating a patient',
    Properties: yup.boolean(),
    defaultValue: false,
  },
};

export const hideablePatientFieldProperties = {
  ...patientDetailsFieldProperties,
  ...hideable,
};

export const displayIdFieldProperties = {
  ...baseFieldProperties,
  pattern: {
    description: 'Regex to enforce the format of field input',
    schema: yup.string(),
    defaultValue: '[\\s\\S]*',
  },
};
