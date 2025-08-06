import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { DataTypes } from 'sequelize';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import type { Task } from './Task';
import type { EncounterPrescription } from './EncounterPrescription';

export class TaskEncounterPrescription extends Model {
  declare id: string;
  declare taskId?: string;
  declare encounterPrescriptionId?: string;

  declare task?: Task;
  declare encounterPrescription?: EncounterPrescription;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        taskId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'tasks',
            key: 'id',
          }
        },
        encounterPrescriptionId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'encounter_prescriptions',
            key: 'id',
          }
        },
      },
      {
        ...options,
        tableName: 'task_encounter_prescriptions',
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        indexes: [
          {
            unique: true,
            fields: ['taskId', 'encounterPrescriptionId'],
          },
        ],
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Task, {
      foreignKey: 'taskId',
      as: 'task',
    });
    this.belongsTo(models.EncounterPrescription, {
      foreignKey: 'encounterPrescriptionId',
      as: 'encounterPrescription',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
} 