import { Sequelize } from 'sequelize';
import { ICAO_DOCUMENT_TYPES, SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class CertificateNotification extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        type: Sequelize.ENUM(...Object.values(ICAO_DOCUMENT_TYPES).map(dt => dt.JSON)),
        forwardAddress: Sequelize.STRING,
        requireSigning: Sequelize.BOOLEAN,
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PUSH_ONLY },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
  }
}
