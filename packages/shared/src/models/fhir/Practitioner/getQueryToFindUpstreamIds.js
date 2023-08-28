export function fromUsers(models, table, id) {
  const { User } = models;

  switch (table) {
    case User.tableName:
      return { where: { id } };

    default:
      return null;
  }
}
