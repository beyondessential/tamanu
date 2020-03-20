import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class LabTestType extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        name: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: '',
        },
        unit: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: '',
        },
        rangeMin: Sequelize.FLOAT,
        rangeMax: Sequelize.FLOAT,
        rangeText: Sequelize.STRING,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'testCategoryId',
    });
  }
}
