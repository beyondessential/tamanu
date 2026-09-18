import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

// A named group of facilities that share confidential data. A facility is sensitive exactly when
// it belongs to a network, so there is no separate sensitivity flag.
// spec: specs/sync/sensitive-networks.md
export class SensitiveNetwork extends Model {
  declare id: string;
  declare code: string;
  declare name: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        ...options,
        // No unique index on code or name: they are labels carried over from the facility each
        // network was made for, and facilities are not unique on either.
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  // No initRelations, deliberately. The generic beforeDestroy hook cascades a soft delete to every
  // HasMany and HasOne target, so declaring facilities as this model's children would soft-delete a
  // network's members. Facility.belongsTo carries the association, and is also what sync's
  // dependency ordering reads.

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
