import { Op } from 'sequelize';

export function filterFromEncounters(models, table) {
  const { Encounter } = models;

  switch (table) {
    case Encounter.tableName:
      return {
        where: {
          endDate: {
            [Op.not]: null,
          },
        },
      };
    default:
      return null;
  }
}
