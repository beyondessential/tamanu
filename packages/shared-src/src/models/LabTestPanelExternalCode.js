import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

export class LabTestPanelExternalCode extends Model {
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
            if (!this.deletedAt && !this.labTestPanelId) {
              throw new InvalidOperationError('A lab test panel external code must have an area.');
            }
          },
        },
      },
    );
  }

  static getListReferenceAssociations() {
    return ['labTestPanel'];
  }

  static initRelations(models) {
    this.belongsTo(models.LabTestPanel, {
      foreignKey: 'labTestPanelId',
      as: 'labTestPanel',
    });
  }
}
