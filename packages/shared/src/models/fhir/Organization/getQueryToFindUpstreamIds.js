export function fromFacilities(models, table, id) {
  const { Facility } = models;

  switch (table) {
    case Facility.tableName:
      return { where: { id } };

    default:
      return null;
  }
}
