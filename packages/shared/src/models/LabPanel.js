import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '../constants';
import { Model } from './Model';

export class LabPanel extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        visibilityStatus: {
          type: Sequelize.STRING,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
        externalCode: Sequelize.TEXT,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static getListReferenceAssociations() {
    return ['category'];
  }

  static initRelations(models) {
    this.belongsToMany(models.LabTestType, {
      through: models.LabPanelLabTestTypes,
      as: 'labTestTypes',
      foreignKey: 'labPanelId',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'categoryId',
      as: 'category',
    });
  }
}
