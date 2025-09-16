import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class ImagingAreaExternalCode extends Model {
  declare id: string;
  declare visibilityStatus: string;
  declare code: string;
  declare description?: string;
  declare areaId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        visibilityStatus: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: 'current',
        },

        code: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        description: DataTypes.TEXT,
      },
      {
        ...options,
        // This is reference/imported data
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        validate: {
          mustHaveVaccine() {
            if (!this.deletedAt && !this.areaId) {
              throw new InvalidOperationError('An imaging area external code must have an area.');
            }
          },
        },
      },
    );
  }

  static getListReferenceAssociations() {
    return ['area'];
  }

  static initRelations(models: Models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'areaId',
      as: 'area',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
