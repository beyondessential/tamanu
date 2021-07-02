import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class Attachment extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        type: Sequelize.STRING(31),
        size: Sequelize.INTEGER,
        data: Sequelize.BLOB,
      },
      {
        ...options,
      },
    );
  }

  static sanitizeForSyncServer({ data, ...restOfValues }) {
    return { ...restOfValues, data: Buffer.from(data, 'base64') };
  }

  static syncDirection = SYNC_DIRECTIONS.PUSH_ONLY;

  static channelRoutes = ['attachment'];
}
