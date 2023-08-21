import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilterJoins } from './buildEncounterLinkedSyncFilter';

export class ProgramRegistryClinicalStatus extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        color: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        visibilityStatus: {
          type: Sequelize.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.ProgramRegistry, {
      foreignKey: 'programRegistryId',
      as: 'programRegistry',
    });
  }
}
