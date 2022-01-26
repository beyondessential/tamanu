import { Sequelize } from 'sequelize';
import { Model } from './Model';
import { ICAO_DOCUMENT_TYPES } from '../constants';

export class CertificateNotification extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        type: Sequelize.ENUM(...Object.values(ICAO_DOCUMENT_TYPES)),
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
