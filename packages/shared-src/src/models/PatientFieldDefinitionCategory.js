import { Sequelize } from 'sequelize';
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
        syncConfig: {
          // TODO
        },
      },
    );
  }

  static initRelations(models) {
    this.hasMany(models.PatientFieldDefinition, {
      foreignKey: 'categoryId',
      as: 'definitions',
    });
  }
}
