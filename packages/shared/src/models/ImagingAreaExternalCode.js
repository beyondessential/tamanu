import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '../errors';
import { Model } from './Model';

export class ImagingAreaExternalCode extends Model {
  static init({ primaryKey, ...options }) {
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

  static initRelations(models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'areaId',
      as: 'area',
    });
  }
}
