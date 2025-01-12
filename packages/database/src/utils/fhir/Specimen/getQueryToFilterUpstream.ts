import type { Models } from '../../../types/model';

export function filterFromLabRequests(models: Models, table: string) {
  const { LabRequest } = models;

  switch (table) {
    case LabRequest.tableName:
      return {
        where: {
          specimenAttached: true,
        },
      };
    default:
      return null;
  }
}
