import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { DataTypes } from 'sequelize';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../sync/buildEncounterLinkedLookupFilter';

export class EncounterPausePrescriptionHistory extends Model {
  declare id: string;
  declare encounterPrescriptionId?: string; // Reference to EncounterPrescription
  declare action: string; // 'pause' or 'resume'
  declare actionDate: string; // When the action occurred
  declare actionUserId?: string; // Who performed the action
  declare notes?: string; // Optional notes about the action
  declare pauseDuration?: number; // Duration of the pause (for 'pause' actions)
  declare pauseTimeUnit?: string; // Time unit for pause duration (for 'pause' actions)

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        action: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        actionDate: dateTimeType('actionDate', {
          allowNull: false,
        }),
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        pauseDuration: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        pauseTimeUnit: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        tableName: 'encounter_pause_prescription_histories',
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.EncounterPrescription, {
      foreignKey: 'encounterPrescriptionId',
      as: 'encounterPrescription',
    });
    this.belongsTo(models.User, {
      foreignKey: 'actionUserId',
      as: 'actionUser',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounter_prescriptions', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this),
      joins: buildEncounterLinkedLookupJoins(this, ['encounter_prescriptions', 'encounters']),
    };
  }
}
