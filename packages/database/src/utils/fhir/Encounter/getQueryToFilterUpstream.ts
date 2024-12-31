import { Op } from 'sequelize';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import type { Models } from '../../../types/model';

export function filterFromEncounters(models: Models, table: string) {
  const { Encounter } = models;

  switch (table) {
    case Encounter.tableName:
      return {
        where: {
          encounterType: { [Op.ne as symbol]: ENCOUNTER_TYPES.SURVEY_RESPONSE },
        },
      };
    default:
      return null;
  }
}
