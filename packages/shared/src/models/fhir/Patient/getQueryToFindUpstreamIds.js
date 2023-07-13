export function fromPatients(models, table, id, deletedRow) {
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
