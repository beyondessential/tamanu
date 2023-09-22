import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export class LogSignature extends Model {
  static init({ primaryKey, ...options }) {
    console.log("INIT LOG SIG");
    super.init(
      {
        id: {
          // this is the non-data message content of the log, not a generated ID
          // (would be called 'message' but other parts of the system expect a model
          // to have a field called 'id' so let's not fight that)
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
