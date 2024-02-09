export function fromLabRequest(models, table, id) {
  const { LabRequest } = models;

  switch (table) {
    case LabRequest.tableName:
      return { where: { id } };

    default:
      return null;
  }
}
