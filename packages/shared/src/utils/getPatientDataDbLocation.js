import { PATIENT_DATA_FIELD_LOCATIONS } from '@tamanu/constants';

export const getPatientDataDbLocation = fieldName => {
  const [modelName, columnName] = PATIENT_DATA_FIELD_LOCATIONS[fieldName] ?? [null, null];
  return {
    modelName,
    fieldName: columnName,
  };
};
