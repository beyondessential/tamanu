import { Op } from 'sequelize';
import type { Models } from '../../../types/model.ts';

export function filterFromEncounters(models: Models, table: string) {
  const { Encounter } = models;

  switch (table) {
    case Encounter.tableName:
      return {
        where: {
          endDate: {
            [Op.not as symbol]: null,
          },
        },
      };
    default:
      return null;
  }
}
