import type { Models } from '../../../types/model';

export function fromPatients(
  models: Models,
  table: string,
  id: string,
  deletedRow: { patient_id: string } | null,
) {
  const { Patient, PatientAdditionalData } = models;

  switch (table) {
    case Patient.tableName:
      return { where: { id } };
    case PatientAdditionalData.tableName:
      if (deletedRow) {
        return { where: { id: deletedRow.patient_id } };
      }

      return {
        include: [
          {
            model: PatientAdditionalData,
            as: 'additionalData',
            required: true,
            where: { id },
          },
        ],
      };
    default:
      return null;
  }
}
