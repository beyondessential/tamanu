export function fromEncounters(models, table, id, deletedRow) {
  const { Encounter, Discharge, Patient, Location } = models;

  switch (table) {
    case Encounter.tableName:
      return { where: { id } };

    case Discharge.tableName:
      if (deletedRow) {
        return { where: { id: deletedRow.encounter_id } };
      }

      return {
        include: [
          {
            model: Discharge,
            as: 'discharge',
            where: { id },
          },
        ],
      };

    case Patient.tableName:
      return {
        include: [
          {
            model: Patient,
            as: 'patient',
            where: { id },
          },
        ],
      };

    case Location.tableName:
      return {
        include: [
          {
            model: Location,
            as: 'location',
            where: { id },
          },
        ],
      };

    default:
      return null;
  }
}
