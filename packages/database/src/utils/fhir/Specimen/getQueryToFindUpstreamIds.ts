import type { Models } from '../../../types/model';

export function fromLabRequest(models: Models, table: string, id: string) {
  const { LabRequest } = models;

  switch (table) {
    case LabRequest.tableName:
      return { where: { id } };

    default:
      return null;
  }
}
