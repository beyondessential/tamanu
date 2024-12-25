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
            required: true,
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
                required: true,
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
                required: true,
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
            required: true,
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
            required: true,
            where: { id },
          },
        ],
      };
    default:
      return null;
  }
}
