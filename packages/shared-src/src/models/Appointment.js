import { Sequelize } from 'sequelize';
import { APPOINTMENT_TYPES } from 'shared/constants';
import { Model } from './Model';

export class Appointment extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        startTime: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        endTime: Sequelize.DATE,
        type: {
          type: Sequelize.ENUM(Object.values(APPOINTMENT_TYPES)),
          allowNull: false,
          defaultValue: APPOINTMENT_TYPES.STANDARD,
        },
        status: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      { ...options },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
    });

    this.belongsTo(models.User, {
      foreignKey: 'clinicianId',
    });

    this.belongsTo(models.Location, {
      foreignKey: 'locationId',
    });
  }
}
