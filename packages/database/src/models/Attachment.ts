import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';
import type { ModelSanitizeArgs } from '../types/sync';

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
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL_THEN_DELETE,
      },
    );
  }

  static sanitizeForDatabase({
    data,
    ...restOfValues
  }: ModelSanitizeArgs<{ data: string; type?: string; size?: number }>) {
    return { ...restOfValues, data: Buffer.from(data, 'base64') };
  }

  // Attachments don't sync on facility. Strangely, they do actually sync as
  // their upload mechanism on mobile. We should probably change this to be consistent on both
  // https://github.com/beyondessential/tamanu/pull/3352
  static sanitizeForCentralServer(values: ModelSanitizeArgs<{ data: string; type?: string; size?: number }>) {
    return this.sanitizeForDatabase(values);
  }
}
