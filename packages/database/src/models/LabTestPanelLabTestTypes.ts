import { type ModelStatic } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { type ModelAttributes } from '../types/sequelize';

export class LabTestPanelLabTestTypes extends Model {
  static init({ primaryKey, sequelize, ...options }: ModelAttributes) {
    super.init(
      {
        id: primaryKey,
      },
      { 
        ...options, 
        primaryKey, 
        sequelize, 
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL 
      },
    );
  }

  static initRelations(this: ModelStatic<LabTestPanelLabTestTypes>, models: { [key: string]: ModelStatic<any> }) {
    this.belongsTo(models.LabTestPanel!, {
      foreignKey: 'labTestPanelId',
      as: 'labTestPanel',
    });
    this.belongsTo(models.LabTestType!, {
      foreignKey: 'labTestTypeId',
      as: 'labTestType',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
