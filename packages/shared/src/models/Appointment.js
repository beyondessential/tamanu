import { Sequelize } from 'sequelize';
import { APPOINTMENT_STATUSES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

export class Appointment extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        startTime: dateTimeType('startTime', { allowNull: false }),
        endTime: dateTimeType('endTime'),
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: APPOINTMENT_STATUSES.CONFIRMED,
        },
        typeLegacy: Sequelize.STRING,
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
      'appointmentType',
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

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'bookingTypeId',
      as: 'bookingType',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'appointmentTypeId',
      as: 'appointmentType',
    });
  }

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    return `
      JOIN
        location_groups
      ON
        appointments.location_group_id = location_groups.id
      WHERE
        appointments.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable})
      AND
        location_groups.facility_id in (:facilityIds)
      AND
        appointments.updated_at_sync_tick > :since
    `;
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: `${this.tableName}.patient_id`,
      }),
    };
  }
}
