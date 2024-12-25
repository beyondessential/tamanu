import { type Setting } from 'types';
import * as yup from 'yup';
import type { ValueOf } from 'type-fest';

export const LOCALISED_FIELD_TYPES = {
  DATE: 'date',
  NUMBER: 'number',
  STRING: 'string',
};
type GenerateFieldSchemaInput = {
  isPatientDetails?: boolean;
  hideable?: boolean;
  type: ValueOf<typeof LOCALISED_FIELD_TYPES>;
};

export const generateFieldSchema = ({ isPatientDetails = false, hideable = true, type }: GenerateFieldSchemaInput) => {
  const schema: Record<string, Setting> = {
    required: {
      description: 'Field is required',
      type: yup.boolean(),
      defaultValue: false,
    },
    defaultValue: {
      description: 'Default value for field',
      type: yup.mixed(),
      defaultValue: null,
    },
  };

  if (hideable) {
    schema.hidden = {
      description: 'Field should not display on forms',
      type: yup.boolean(),
      defaultValue: false,
    };
  }

  if (isPatientDetails) {
    schema.requiredPatientData = {
      description: 'Field must be filled out when creating a patient',
      type: yup.boolean(),
      defaultValue: false,
    };
  }

  switch (type) {
    case LOCALISED_FIELD_TYPES.STRING:
      if(schema.defaultValue) schema.defaultValue.type = yup.string().nullable();
      break;

    case LOCALISED_FIELD_TYPES.NUMBER:
      if(schema.defaultValue) schema.defaultValue.type = yup.number().nullable();
      break;
  }

  return schema;
};

// Special schemas
export const displayIdFieldProperties = {
  ...generateFieldSchema({ hideable: false, type: LOCALISED_FIELD_TYPES.STRING }),
  pattern: {
    description: 'Regex to enforce the format of field input',
    type: yup.string(),
    defaultValue: '[\\s\\S]*',
  },
};
