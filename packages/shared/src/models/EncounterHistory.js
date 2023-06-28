import { Sequelize } from 'sequelize';

import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { SYNC_DIRECTIONS } from '../constants';

export class EncounterHistory extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        encounterType: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        date: dateTimeType('startDate', {
          allowNull: false,
        }),
      },
      {
        ...options,
        tableName: 'encounter_history',
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.belongsTo(models.User, {
      foreignKey: 'examinerId',
      as: 'examiner',
    });

    this.belongsTo(models.Location, {
      foreignKey: 'locationId',
      as: 'location',
    });

    this.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department',
    });
  }
}
