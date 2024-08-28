import * as yup from 'yup';

const hideable = {
  hidden: {
    description: 'Field should not display on forms',
    type: yup.boolean(),
    defaultValue: false,
  },
};

export const baseFieldProperties = {
  defaultValue: {
    description: 'Default value for field',
    type: yup.mixed(),
    defaultValue: null,
  },
  required: {
    description: 'Field is required',
    type: yup.boolean(),
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
    type: yup.boolean(),
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
    type: yup.string(),
    defaultValue: '[\\s\\S]*',
  },
};
