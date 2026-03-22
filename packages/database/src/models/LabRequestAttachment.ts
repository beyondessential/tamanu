import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { DataTypes } from 'sequelize';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import type { InitOptions, Models } from '../types/model';
import type { SessionConfig } from '../types/sync';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../sync/buildEncounterLinkedLookupFilter';

export class LabRequestAttachment extends Model {
  declare id: string;
  declare attachmentId: string;
  declare title: string;
  declare replacedById?: string;
  declare labRequestId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
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
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.LabRequest, {
      foreignKey: 'labRequestId',
      as: 'labRequest',
    });
  }

  static buildPatientSyncFilter(
    patientCount: number,
    markedForSyncPatientsTable: string,
    sessionConfig: SessionConfig,
  ) {
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

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this, {
        isLabRequestValue: 'TRUE',
      }),
      joins: buildEncounterLinkedLookupJoins(this, ['lab_requests', 'encounters']),
    };
  }
}
