import { SYNC_DIRECTIONS } from '../constants';
import { Model } from './Model';

export class LabPanelLabTestTypes extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.LabPanel, {
      foreignKey: 'labPanelId',
      as: 'labPanel',
    });
    this.belongsTo(models.LabTestType, {
      foreignKey: 'labTestTypeId',
      as: 'labTestType',
    });
  }
}
