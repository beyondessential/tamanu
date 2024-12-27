import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { DataTypes, type ModelStatic } from 'sequelize';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '@tamanu/shared/models/buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from '@tamanu/shared/sync/buildSyncLookupSelect';
import { type ModelAttributes, type SessionConfig } from '../types/sequelize';

export class LabRequestAttachment extends Model {
  static init({ primaryKey, sequelize, ...options }: ModelAttributes) {
    super.init(
      {
        id: primaryKey,
        // Relation can't be managed by sequelize because the
        // attachment won't get downloaded to facility server
        attachmentId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        replacedById: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        ...options,
        primaryKey,
        sequelize,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(this: ModelStatic<LabRequestAttachment>, models: { [key: string]: ModelStatic<any> }) {
    this.belongsTo(models.LabRequest!, {
      foreignKey: 'labRequestId',
      as: 'labRequest',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string, sessionConfig: SessionConfig) {
    if (sessionConfig.syncAllLabRequests) {
      return ''; // include all lab request attachments
    }
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'lab_requests', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: 'encounters.patient_id',
        isLabRequestValue: 'TRUE',
      }),
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'lab_requests', 'encounters']),
    };
  }
}
