import { PATIENT_DATA_FIELD_LOCATIONS } from '@tamanu/constants';

export const getPatientDataDbLocation = fieldName => {
  if (PATIENT_DATA_FIELD_LOCATIONS[fieldName]) {
    const [modelName, columnName] = PATIENT_DATA_FIELD_LOCATIONS[fieldName];
    return {
      modelName,
      fieldName: columnName,
    };
  }
  throw new Error(`Unknown fieldName: ${fieldName}`);
};
