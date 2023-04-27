export function getQueryOptions(models) {
  const { Encounter } = models;

  return {
    [Encounter.tableName]: {},
  };
}
