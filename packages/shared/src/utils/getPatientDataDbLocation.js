import { PATIENT_DATA_FIELD_LOCATIONS } from '@tamanu/constants';

export const getPatientDataDbLocation = async (fieldName, models) => {
  // Look up the field in the models
  if (fieldName in PATIENT_DATA_FIELD_LOCATIONS) {
    const [modelName, columnName] = PATIENT_DATA_FIELD_LOCATIONS[fieldName];
    return {
      modelName,
      fieldName: columnName,
    };
  }

  // Look up the field in custom patient fields
  const isCustomPatientField = await models.PatientFieldDefinition.findByPk(fieldName);
  if (isCustomPatientField) {
    return {
      modelName: 'PatientFieldValue',
      fieldName,
    };
  }

  return {
    modelName: null,
    fieldName: null,
  };
};
