import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class LabPanelRequest extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.hasMany(models.LabRequest, {
      foreignKey: 'labPanelRequestId',
      as: 'labRequests',
    });
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.LabTestPanel, {
      foreignKey: 'labTestPanelId',
      as: 'panel',
    });
  }
}
