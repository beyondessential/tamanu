import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export class TaskTemplateDesignation extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  /**
   *
   * @param {import('./')} models
   */
  static initRelations(models) {
    this.belongsTo(models.TaskTemplate, {
      foreignKey: 'taskTemplateId',
      as: 'taskTemplate',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'designationId',
      as: 'designation',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
