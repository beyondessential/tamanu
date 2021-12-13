import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class DocumentMetadata extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        type: Sequelize.TEXT,
        documentCreatedAt: Sequelize.DATE,
        documentUploadedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        documentOwner: Sequelize.TEXT,
        note: Sequelize.STRING,
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Attachment, {
      foreignKey: 'attachmentId',
      as: 'document',
    });

    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'departmentId',
      as: 'department',
    });
  }
}
