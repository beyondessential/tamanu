import type { Models } from '../../../types/model.ts';

export function fromUsers(models: Models, table: string, id: string) {
  const { User } = models;

  switch (table) {
    case User.tableName:
      return { where: { id } };

    default:
      return null;
  }
}
