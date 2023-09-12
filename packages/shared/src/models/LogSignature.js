import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export class LogSignature extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        message: {
          type: Sequelize.STRING,
          primaryKey: true,
          allowNull: false,
        },
        keys: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        reviewed: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        safe: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        forbid: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        indexes: [{ fields: ['message'], unique: true }],
      },
    );
  }
}
