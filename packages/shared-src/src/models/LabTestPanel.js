import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from 'shared/constants';
import { Model } from './Model';

export class LabTestPanel extends Model {
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
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsToMany(models.LabTestType, {
      through: models.LabTestPanelLabTestTypes,
      as: 'labTestTypes',
      foreignKey: 'labTestPanelId',
    });

    this.hasOne(models.LabTestPanelExternalCode, {
      as: 'labTestPanelExternalCode',
      foreignKey: 'labTestPanelId',
    });
  }
}
