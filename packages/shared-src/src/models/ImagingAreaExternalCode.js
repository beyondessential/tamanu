import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

export class ImagingAreaExternalCode extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        visibilityStatus: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'current',
        },

        code: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: DataTypes.STRING,
      },
      {
        ...options,
        // This is reference/imported data
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PULL_ONLY },
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
