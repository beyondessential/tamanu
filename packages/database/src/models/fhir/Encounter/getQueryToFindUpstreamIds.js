export function fromEncounters(models, table, id, deletedRow) {
  const { Encounter, Discharge, Patient, Location, LocationGroup } = models;

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
            required: true,
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
            required: true,
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
            required: true,
            where: { id },
          },
        ],
      };

    case LocationGroup.tableName:
      return {
        include: [
          {
            model: Location,
            as: 'location',
            required: true,
            include: [
              {
                model: LocationGroup,
                as: 'locationGroup',
                required: true,
                where: { id },
              },
            ],
          },
        ],
      };

    default:
      return null;
  }
}
