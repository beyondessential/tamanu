import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class LabTestPanel extends Model {
  declare id: string;
  declare code: string;
  declare name: string;
  declare visibilityStatus: string;
  declare externalCode?: string;
  declare categoryId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        visibilityStatus: {
          type: DataTypes.STRING,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
        externalCode: DataTypes.TEXT,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static getListReferenceAssociations() {
    return ['category'];
  }

  static initRelations(models: Models) {
    this.belongsToMany(models.LabTestType, {
      through: models.LabTestPanelLabTestTypes,
      as: 'labTestTypes',
      foreignKey: 'labTestPanelId',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'categoryId',
      as: 'category',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
