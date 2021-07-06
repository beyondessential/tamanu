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
        syncConfig: {
          syncDirection: SYNC_DIRECTIONS.PUSH_ONLY,
          channelRoutes: [{ route: 'attachment' }],
        },
      },
    );
  }

  static sanitizeForSyncServer({ data, ...restOfValues }) {
    return { ...restOfValues, data: Buffer.from(data, 'base64') };
  }
}
