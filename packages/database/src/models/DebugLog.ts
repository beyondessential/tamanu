import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model.ts';
import type { InitOptions } from '../types/model.ts';

export class DebugLog extends Model {
  declare id: string;
  declare type?: string;
  declare info?: Record<string, any>;

  static initModel({ primaryKey, ...options }: InitOptions) {
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

  async addInfo(info: Record<string, any>) {
    await this.update({
      info: { ...this.info, ...info },
    });
  }
}
