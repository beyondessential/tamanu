export function getQueryOptions(models) {
  const { Encounter, Discharge, Patient } = models;

  return {
    [Encounter.tableName]: {
      include: [
        {
          model: Discharge,
          as: 'discharge',
          required: false,
        },
        {
          model: Patient,
          as: 'patient',
        },
      ],
    },
  };
}
