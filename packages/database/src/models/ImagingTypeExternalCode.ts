import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

export class ImagingTypeExternalCode extends Model {
  declare id: string;
  declare visibilityStatus: string;
  declare code: string;
  declare description?: string;
  declare imagingTypeCode: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        visibilityStatus: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: 'current',
        },
        imagingTypeCode: {
          type: DataTypes.TEXT,
          allowNull: false,
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
          mustHaveImagingType() {
            if (!this.deletedAt && !this.imagingTypeCode) {
              throw new InvalidOperationError(
                'An imaging type external code must have an imaging type.',
              );
            }
          },
        },
      },
    );
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
