import { DataTypes, Sequelize } from 'sequelize';

import { SYNC_DIRECTIONS, VISIBILITY_STATUSES, PORTAL_USER_STATUSES } from '@tamanu/constants';
import type { InitOptions, Models } from '../types/model';
import { Model } from './Model';

export class PortalUser extends Model {
  declare id: string;
  declare email: string;
  declare patientId: string;
  declare visibilityStatus: string;
  declare status: string;

  forResponse() {
    return Object.assign({}, this.dataValues);
  }

  static async getForAuthByEmail(email: string) {
    const user = await this.findOne({
      where: {
        // email addresses are case insensitive so compare them as such
        email: Sequelize.where(
          Sequelize.fn('lower', Sequelize.col('email')),
          Sequelize.fn('lower', email),
        ),
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  }

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        patientId: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
            model: 'patients',
            key: 'id',
          },
        },
        visibilityStatus: {
          type: DataTypes.STRING,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
        status: {
          type: DataTypes.STRING,
          defaultValue: PORTAL_USER_STATUSES.PENDING,
          allowNull: false,
        },
      },
      {
        ...options,
        indexes: [],
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.hasMany(models.PortalOneTimeToken, {
      foreignKey: 'portalUserId',
      as: 'oneTimeTokens',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
