import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import { applyFacilitySettingMigrations } from '../sync/applyFacilitySettingMigrations';
import type { InitOptions, Models } from '../types/model';

// Transient carrier for the config→settings migration. A facility server can't persist
// its own facility-scoped settings (they're PULL_FROM_CENTRAL), so it writes each legacy
// config value here; the row pushes up and central turns it into a facility Setting.
// PUSH_TO_CENTRAL_THEN_DELETE so the rows drain off the facility once pushed.
export class FacilitySettingMigration extends Model {
  declare id: string;
  declare key: string;
  declare value: unknown;
  declare facilityId?: string;
  declare deviceId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        key: { type: DataTypes.TEXT, allowNull: false },
        value: { type: DataTypes.JSONB, allowNull: false },
        // Set for machine-level (server scope) rows, which have no facility.
        deviceId: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL_THEN_DELETE,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Facility, { foreignKey: 'facilityId', as: 'facility' });
  }

  static async adjustDataPostSyncPush(ids: string[]) {
    await applyFacilitySettingMigrations(this.sequelize.models, ids);
  }
}
