import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class IPSRequest extends Model {
  id!: string;
  createdBy?: string;
  email?: string;
  status?: string;
  error?: string;
  patientId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        createdBy: DataTypes.STRING,
        email: DataTypes.STRING,
        status: DataTypes.STRING,
        error: DataTypes.TEXT,
      },
      {
        ...options,
        tableName: 'ips_requests',
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
      },
    );
  }

  static initRelations(models: Models) {
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
