import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class UserPatientView extends Model {
  declare id: string;
  declare viewedById: string;
  declare patientId: string;
  declare facilityId?: string;
  declare sessionId: string;
  declare loggedAt: string;
  declare context: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        loggedAt: {
          type: DataTypes.STRING,
        },
        context: {
          type: DataTypes.STRING,
        },
        sessionId: {
          type: DataTypes.STRING,
        },
      },

      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC, schema: 'logs' },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.User, {
      foreignKey: 'viewedById',
      as: 'viewedBy',
    });

    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
  }
}
