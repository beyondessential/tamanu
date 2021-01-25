import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class Patient extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        displayId: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false,
        },

        firstName: Sequelize.STRING,
        middleName: Sequelize.STRING,
        lastName: Sequelize.STRING,
        culturalName: Sequelize.STRING,

        dateOfBirth: Sequelize.DATE,
        sex: {
          type: Sequelize.ENUM('male', 'female', 'other'),
          allowNull: false,
        },
        bloodType: Sequelize.STRING,
      },
      {
        ...options,
        indexes: [{ fields: ['display_id'] }, { fields: ['last_name'] }],
      },
    );
  }

  static initRelations(models) {
    this.hasMany(models.Encounter);

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'villageId',
    });
  }
}
