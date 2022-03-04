import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class CertificateNotification extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        type: Sequelize.STRING,
        forwardAddress: Sequelize.STRING,
        requireSigning: Sequelize.BOOLEAN,
      },
      {
        ...options,

        // Note that if this changes to bidirectional, the SendCertificateNotification task
        // will need to be updated / limited to handle only new publishes!
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PUSH_ONLY },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    // For test certificates only
    this.belongsTo(models.LabTest, {
      foreignKey: 'labTestId',
      as: 'labTest',
    });
  }
}
