import { DataTypes, Sequelize } from 'sequelize';

import { SYNC_DIRECTIONS, VISIBILITY_STATUSES, PORTAL_USER_STATUSES } from '@tamanu/constants';
import type { InitOptions, Models } from '../types/model';
import { Model } from './Model';
import type { Patient } from './Patient';

export class PortalUser extends Model {
  declare id: string;
  declare email: string;
  declare patientId: string;
  declare visibilityStatus: string;
  declare status: string;
  declare patient?: Patient;

  forResponse() {
    return Object.assign({}, this.dataValues);
  }

  /** Several patients can share an email, so this is every patient the email signs in to. */
  static async getLivingByEmail(email: string) {
    const portalUsers = await this.findAll({
      where: {
        // email addresses are case insensitive so compare them as such
        email: Sequelize.where(
          Sequelize.fn('lower', Sequelize.col('PortalUser.email')),
          Sequelize.fn('lower', email),
        ),
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
      include: ['patient'],
      order: [['createdAt', 'ASC']],
    });
    return portalUsers.filter(portalUser => !portalUser.patient?.dateOfDeath);
  }

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        email: {
          type: DataTypes.STRING,
          allowNull: false,
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
