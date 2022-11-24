import { Sequelize } from 'sequelize';
import { APPOINTMENT_TYPES, APPOINTMENT_STATUSES, SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';

export class Appointment extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        startTime: dateTimeType('startTime', { allowNull: false }),
        endTime: dateTimeType('endTime'),
        type: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: APPOINTMENT_TYPES.STANDARD,
        },
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: APPOINTMENT_STATUSES.CONFIRMED,
        },
      },
      { syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC, ...options },
    );
  }

  static getListReferenceAssociations() {
    return [
      { association: 'patient', include: ['village'] },
      'clinician',
      'location',
      'locationGroup',
    ];
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      as: 'patient',
      foreignKey: 'patientId',
    });

    this.belongsTo(models.User, {
      as: 'clinician',
      foreignKey: 'clinicianId',
    });

    this.belongsTo(models.LocationGroup, {
      as: 'locationGroup',
      foreignKey: 'locationGroupId',
    });

    this.belongsTo(models.Location, {
      as: 'location',
      foreignKey: 'locationId',
    });
  }
}
