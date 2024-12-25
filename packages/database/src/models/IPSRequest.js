import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export class IPSRequest extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        createdBy: Sequelize.STRING,
        email: Sequelize.STRING,
        status: Sequelize.STRING,
        error: Sequelize.TEXT,
      },
      {
        ...options,
        tableName: 'ips_requests',
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
    this.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'createdByUser',
    });
  }
}
