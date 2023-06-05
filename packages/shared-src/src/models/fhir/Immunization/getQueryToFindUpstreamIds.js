export function fromAdministeredVaccines(models, table, id) {
  const { AdministeredVaccine, Encounter, Patient, ReferenceData, ScheduledVaccine, User } = models;

  switch (table) {
    case AdministeredVaccine.tableName:
      return { where: { id } };
    case Encounter.tableName:
      return {
        include: [
          {
            model: Encounter,
            as: 'encounter',
            where: { id },
          },
        ],
      };
    case Patient.tableName:
      return {
        include: [
          {
            model: Encounter,
            as: 'encounter',
            required: true,
            include: [
              {
                model: Patient,
                as: 'patient',
                where: { id },
              },
            ],
          },
        ],
      };
    case ReferenceData.tableName:
      return {
        include: [
          {
            model: ScheduledVaccine,
            as: 'scheduledVaccine',
            required: true,
            include: [
              {
                model: ReferenceData,
                as: 'vaccine',
                where: { id },
              },
            ],
          },
        ],
      };
    case ScheduledVaccine.tableName:
      return {
        include: [
          {
            model: ScheduledVaccine,
            as: 'scheduledVaccine',
            where: { id },
          },
        ],
      };
    case User.tableName:
      return {
        include: [
          {
            model: User,
            as: 'recorder',
            where: { id },
          },
        ],
      };
    default:
      return null;
  }
}
