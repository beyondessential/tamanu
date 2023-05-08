export function getQueryOptions(models) {
  const { Patient, PatientAdditionalData } = models;

  const patientOptions = {
    include: [
      {
        model: PatientAdditionalData,
        as: 'additionalData',
        limit: 1,
      },
    ],
  };

  return {
    [Patient.tableName]: patientOptions,
  };
}
