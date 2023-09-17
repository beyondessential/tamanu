import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export class PatientFieldDefinitionCategory extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models) {
    this.hasMany(models.PatientFieldDefinition, {
      foreignKey: 'categoryId',
      as: 'definitions',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
