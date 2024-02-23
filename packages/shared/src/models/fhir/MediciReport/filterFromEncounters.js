import { Op } from 'sequelize';

export function filterFromEncounters(models, table) {
  const { Encounter } = models;

  switch (table) {
    case Encounter.tableName:
      return {
        where: {
          endDate: {
            [Op.is]: null,
          },
        },
      };
    default:
      return null;
  }
}
