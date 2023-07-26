import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export class LabTestPanelLabTestTypes extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.LabTestPanel, {
      foreignKey: 'labTestPanelId',
      as: 'labTestPanel',
    });
    this.belongsTo(models.LabTestType, {
      foreignKey: 'labTestTypeId',
      as: 'labTestType',
    });
  }
}
