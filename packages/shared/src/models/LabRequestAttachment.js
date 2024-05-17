import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { Sequelize } from 'sequelize';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';

export class LabRequestAttachment extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        // Relation can't be managed by sequelize because the
        // attachment won't get downloaded to facility server
        attachmentId: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        replacedById: {
          type: Sequelize.STRING,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.LabRequest, {
      foreignKey: 'labRequestId',
      as: 'labRequest',
    });
  }

  static buildPatientSyncFilter(patientIds, sessionConfig) {
    if (sessionConfig.syncAllLabRequests) {
      return ''; // include all lab request attachments
    }
    if (patientIds.length === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter([this.tableName, 'lab_requests', 'encounters']);
  }
}
