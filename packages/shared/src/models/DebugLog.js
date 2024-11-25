import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';

export class DebugLog extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        type: DataTypes.STRING,
        info: { type: DataTypes.JSON },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        schema: 'logs',
        timestamps: false,
      },
    );
  }

  async addInfo(info) {
    await this.update({
      info: { ...this.info, ...info },
    });
  }
}
