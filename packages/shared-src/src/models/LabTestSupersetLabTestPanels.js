import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class LabTestSupersetLabTestPanels extends Model {
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
    this.belongsTo(models.LabTestSuperset, {
      foreignKey: 'labTestSupersetId',
      as: 'labTestSuperset',
    });
  }
}
