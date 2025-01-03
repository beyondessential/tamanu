import type { Models } from '../../../types/model';

export function getQueryOptions(models: Models) {
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
