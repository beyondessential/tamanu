import { DataTypes, Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';

export class UserPreference extends Model {
  static init(options) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          unique: true,
          defaultValue: Sequelize.fn('uuid_generate_v4'),
        },
        selectedGraphedVitalsOnFilter: Sequelize.STRING,
        locationBookingFilters: Sequelize.JSONB,
        outpatientAppointmentFilters: Sequelize.JSONB,
        userId: {
          type: DataTypes.STRING,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        encounterTabOrders: {
          type: DataTypes.JSONB,
          defaultValue: {},
        },
        facilityId: {
          type: DataTypes.STRING,
          references: {
            model: 'facilities',
            key: 'id',
          },
        },
      },
      {
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        indexes: [
          {
            unique: true,
            fields: ['userId', 'facilityId'],
          },
        ],
        ...options,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }

  static buildSyncFilter() {
    return null;
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
