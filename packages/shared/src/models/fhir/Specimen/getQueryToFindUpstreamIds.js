export function fromLabRequest(models, table, id) {
  const { LabRequest } = models;
  console.log({ id });
  console.log({ table });
  switch (table) {
    case LabRequest.tableName:
      return { where: { id } };

    default:
      return null;
  }
}
