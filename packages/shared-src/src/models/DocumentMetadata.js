import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class DocumentMetadata extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: Sequelize.TEXT,
        type: Sequelize.STRING(31),
        documentCreatedAt: Sequelize.DATE,
        documentUploadedAt: Sequelize.DATE,
        documentOwner: Sequelize.TEXT,
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
  }
}
