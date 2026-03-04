import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class LabTestPanelLabTestTypes extends Model {
  declare id: string;
  declare labTestPanelId?: string;
  declare labTestTypeId?: string;
  declare order: number;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.LabTestPanel, {
      foreignKey: 'labTestPanelId',
      as: 'labTestPanel',
    });

    this.belongsTo(models.LabTestType, {
      foreignKey: 'labTestTypeId',
      as: 'labTestType',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
