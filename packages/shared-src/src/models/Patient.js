import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
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
        email: Sequelize.STRING,
        markedForSync: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
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

    // technically this relation is hasOne but this just describes 
    // "there is another table referencing this one by id"
    this.hasMany(models.PatientAdditionalData, {
      foreignKey: 'patientId',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'villageId',
      as: 'village',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'sexId',
      as: 'sex',
    });
  }

  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  static async getSyncIds() {
    const patients = await this.sequelize.models.Patient.findAll({
      where: { markedForSync: true },
      raw: true,
      attributes: ['id'],
    });
    return patients.map(({ id }) => id);
  }
}
