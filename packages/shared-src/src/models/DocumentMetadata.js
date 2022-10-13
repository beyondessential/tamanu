import { Sequelize, Op } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';
import { buildPatientLinkedSyncFilter } from './buildPatientLinkedSyncFilter';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
export class DocumentMetadata extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        type: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        documentCreatedAt: Sequelize.DATE,
        documentUploadedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        documentOwner: Sequelize.TEXT,
        note: Sequelize.STRING,

        // Relation can't be managed by sequelize because the
        // attachment won't get downloaded to lan server
        attachmentId: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department',
    });
  }

  static buildSyncFilter(patientIds, sessionConfig) {
    if (patientIds.length === 0) {
      return null;
    }
    const patientFilter = buildPatientLinkedSyncFilter(patientIds);
    const encounterFilter = buildEncounterLinkedSyncFilter(patientIds, sessionConfig);
    return {
      where: { [Op.or]: [patientFilter.where, encounterFilter.where] },
      include: encounterFilter.include,
    };
  }
}
