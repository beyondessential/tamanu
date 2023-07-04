import { Sequelize } from 'sequelize';

import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { SYNC_DIRECTIONS } from '../constants';
import { getCurrentDateTimeString } from '../utils/dateTime';

export class EncounterHistory extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        encounterType: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        date: dateTimeType('date', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
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

  static async createSnapshot(data) {
    await EncounterHistory.create({
      encounterId: data.encounterId,
      encounterType: data.encounterType,
      locationId: data.locationId,
      departmentId: data.departmentId,
      examinerId: data.examinerId,
      date: data.submittedTime || getCurrentDateTimeString(),
    });
  }
}
