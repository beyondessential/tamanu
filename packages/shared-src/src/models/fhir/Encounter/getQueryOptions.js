export function getQueryOptions(models) {
  const { Encounter, Discharge } = models;

  return {
    [Encounter.tableName]: {
      include: [
        {
          model: Discharge,
          as: 'discharge',
          required: false,
        },
      ],
    },
  };
}
