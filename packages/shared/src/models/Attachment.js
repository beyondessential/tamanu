import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export class Attachment extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        type: Sequelize.TEXT,
        size: Sequelize.INTEGER,
        data: Sequelize.BLOB,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
      },
    );
  }

  static sanitizeForDatabase({ data, ...restOfValues }) {
    return { ...restOfValues, data: Buffer.from(data, 'base64') };
  }

  // Attachments don't sync on desktop. Strangely, they do actually sync as
  // their upload mechanism on mobile. We should probably change this to be consistent on both
  // https://github.com/beyondessential/tamanu/pull/3352
  static sanitizeForCentralServer(values) {
    return this.sanitizeForDatabase(values);
  }
}
