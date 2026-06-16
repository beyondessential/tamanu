import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model.ts';
import type { InitOptions, Models } from '../types/model.ts';

export class UserDesignation extends Model {
  declare id: string;
  declare userId?: string;
  declare designationId?: number;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static getListReferenceAssociations() {
    return ['referenceData'];
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'designationId',
      as: 'referenceData',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
