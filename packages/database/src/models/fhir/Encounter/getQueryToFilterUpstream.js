import { Op } from 'sequelize';
import { ENCOUNTER_TYPES } from '@tamanu/constants';

export function filterFromEncounters(models, table) {
  const { Encounter } = models;

  switch (table) {
    case Encounter.tableName:
      return {
        where: {
          encounterType: { [Op.ne]: ENCOUNTER_TYPES.SURVEY_RESPONSE },
        },
      };
    default:
      return null;
  }
}
