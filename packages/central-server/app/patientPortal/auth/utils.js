export const findPatientUserById = async (models, patientUserId) => {
  const patientUser = await models.PatientUser.findByPk(patientUserId);
  return patientUser ?? null;
};
