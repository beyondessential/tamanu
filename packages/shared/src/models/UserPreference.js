import { DataTypes, Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';

export class UserPreference extends Model {
  static init(options) {
    super.init(
      {
        id: {
          // translated_string records use a generated primary key that enforces one per string and language,
          type: `TEXT GENERATED ALWAYS AS (COALESCE("user_id", '') || ';' || COALESCE("facility_id", '')) STORED`,
          set() {
            // any sets of the convenience generated "id" field can be ignored
          },
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
