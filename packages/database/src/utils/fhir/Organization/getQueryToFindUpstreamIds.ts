import type { Models } from '../../../types/model';

export function fromFacilities(models: Models, table: string, id: string) {
  const { Facility } = models;

  switch (table) {
    case Facility.tableName:
      return { where: { id } };

    default:
      return null;
  }
}
