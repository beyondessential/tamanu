import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions } from '../types/model';

export class DebugLog extends Model {
  id!: string;
  type?: string;
  info?: Record<string, any>;

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
