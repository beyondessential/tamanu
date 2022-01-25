import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class CertificateNotification extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        type: Sequelize.ENUM,
        forwardAddress: Sequelize.STRING,
        requireSigning: Sequelize.BOOLEAN,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
  }
}
