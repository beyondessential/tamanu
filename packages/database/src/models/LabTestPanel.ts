import { DataTypes, type ModelStatic } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import { type ModelAttributes } from '../types/sequelize';

export class LabTestPanel extends Model {
  static init({ primaryKey, sequelize, ...options }: ModelAttributes) {
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
        primaryKey,
        sequelize,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static getListReferenceAssociations() {
    return ['category'];
  }

  static initRelations(this: ModelStatic<LabTestPanel>, models: { [key: string]: ModelStatic<any> }) {
    this.belongsToMany(models.LabTestType!, {
      through: models.LabTestPanelLabTestTypes!,
      as: 'labTestTypes',
      foreignKey: 'labTestPanelId',
    });

    this.belongsTo(models.ReferenceData!, {
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
