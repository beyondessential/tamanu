import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class LabTestPanel extends Model {
  id!: string;
  code!: string;
  name!: string;
  visibilityStatus!: string;
  externalCode?: string;
  categoryId?: string;

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

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
