import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { dateTimeType } from './dateTimeTypes';

export class Procedure extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        completed: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        date: dateTimeType('date', { allowNull: false }),
        endTime: dateTimeType('endTime'),
        startTime: dateTimeType('startTime'),
        note: Sequelize.TEXT,
        completedNote: Sequelize.TEXT,
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  static getListReferenceAssociations() {
    return ['Location', 'ProcedureType', 'Anaesthetic'];
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.Location, {
      foreignKey: 'locationId',
      as: 'Location',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'procedureTypeId',
      as: 'ProcedureType',
    });
    this.belongsTo(models.User, {
      foreignKey: 'physicianId',
      as: 'Physician',
    });
    this.belongsTo(models.User, {
      foreignKey: 'assistantId',
      as: 'Assistant',
    });
    this.belongsTo(models.User, {
      foreignKey: 'anaesthetistId',
      as: 'Anaesthetist',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'anaestheticId',
      as: 'Anaesthetic',
    });
  }

  static buildPatientSyncFilter(patientIds) {
    if (patientIds.length === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter([this.tableName, 'encounters']);
  }
}
