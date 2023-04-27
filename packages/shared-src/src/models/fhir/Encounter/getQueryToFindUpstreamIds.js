export function fromEncounters(models, table, id) {
  const { Encounter } = models;

  switch (table) {
    case Encounter.tableName:
      return { where: { id } };
    default:
      return null;
  }
}
