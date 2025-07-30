export const findPatientUserById = async (models, patientUserId) => {
  return await models.PatientUser.findByPk(patientUserId);
};
