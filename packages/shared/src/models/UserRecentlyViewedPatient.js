import { SYNC_DIRECTIONS } from '../constants';

import { Model } from './Model';

export class UserRecentlyViewedPatient extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
      },
      { syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC, ...options },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }

  static async create(data) {
    return super.upsert(data, {
      conflictFields: ['user_id', 'patient_id'],
    });
  }
}
