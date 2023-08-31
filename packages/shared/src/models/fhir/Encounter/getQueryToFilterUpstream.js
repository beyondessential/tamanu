export function filterFromEncounters(models, table) {
  const { Encounter } = models;

  switch (table) {
    case Encounter.tableName:
      return {
        where: {
          encounterType: 'surveyResponse',
        },
      };
    default:
      return null;
  }
}
