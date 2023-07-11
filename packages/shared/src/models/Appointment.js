import { Sequelize } from 'sequelize';
import { APPOINTMENT_TYPES, APPOINTMENT_STATUSES, SYNC_DIRECTIONS } from '../constants';
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
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
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

    // Appointments are assigned a Location Group but the Location relation exists for legacy data
    this.belongsTo(models.Location, {
      as: 'location',
      foreignKey: 'locationId',
    });
  }

  static buildSyncFilter(patientIds) {
    if (patientIds.length === 0) {
      return null;
    }
    return `
      JOIN
        location_groups
      ON
        appointments.location_group_id = location_groups.id
      WHERE
        appointments.patient_id IN (:patientIds)
      AND
        location_groups.facility_id = :facilityId
      AND
        appointments.updated_at_sync_tick > :since
    `;
  }
}
