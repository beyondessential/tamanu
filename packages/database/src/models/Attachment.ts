import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

export class Attachment extends Model {
  declare id: string;
  declare type?: String;
  declare size?: Number;
  declare data?: Buffer;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        type: DataTypes.TEXT,
        size: DataTypes.INTEGER,
        data: DataTypes.BLOB,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
      },
    );
  }

  static sanitizeForDatabase({ data, ...restOfValues }: { data: any; [key: string]: any }) {
    return { ...restOfValues, data: Buffer.from(data, 'base64') } as { [key: string]: any };
  }

  // Attachments don't sync on facility. Strangely, they do actually sync as
  // their upload mechanism on mobile. We should probably change this to be consistent on both
  // https://github.com/beyondessential/tamanu/pull/3352
  static sanitizeForCentralServer(values: { [key: string]: any; data: any }) {
    return this.sanitizeForDatabase(values);
  }
}
