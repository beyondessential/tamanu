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
        title: Sequelize.STRING,
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
        additionalDetails: Sequelize.TEXT,
      },
      {
        ...options,
        indexes: [{ fields: ['display_id'] }, { fields: ['last_name'] }],
      },
    );
  }

  static initRelations(models) {
    this.hasMany(models.Encounter, {
      foreignKey: 'patientId',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'villageId',
      as: 'village',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'ethnicityId',
      as: 'ethnicity',
    });
  }
}
