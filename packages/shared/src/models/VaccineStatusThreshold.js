import { SYNC_DIRECTIONS } from '@tamanu/constants';
import Sequelize from 'sequelize';
import { Model } from './Model';

export class VaccineStatusThreshold extends Model {
  static init(options) {
    super.init(
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
          primaryKey: true,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        threshold: {
          type: Sequelize.DOUBLE,
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM('SCHEDULED', 'UPCOMING', 'DUE', 'OVERDUE', 'MISSED'),
          allowNull: false,
          unique: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
