import { Sequelize } from 'sequelize';
import { DAYS_OF_WEEK, REPEAT_FREQUENCY_VALUES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

/**
 * Schema to follow iCalendar standard for recurring events.
 * @see https://icalendar.org/iCalendar-RFC-5545/3-3-10-recurrence-rule.html
 */
export class AppointmentSchedule extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        startDate: dateTimeType('startDate', { allowNull: false }),
        untilDate: dateTimeType('untilDate'),
        interval: { type: Sequelize.INTEGER, allowNull: false },
        frequency: {
          type: Sequelize.ENUM(REPEAT_FREQUENCY_VALUES),
          allowNull: false,
        },
        daysOfWeek: {
          type: Sequelize.ARRAY(Sequelize.ENUM(DAYS_OF_WEEK)),
          allowNull: true,
        },
        nthWeekday: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        occurrenceCount: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  static getListReferenceAssociations() {}

  static initRelations(models) {
    this.hasMany(models.Appointment, {
      as: 'appointments',
      foreignKey: 'scheduleId',
    });
  }

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    return `
      JOIN
        appointments
      ON
        appointments.schedule_id = appointment_schedule.id
      JOIN
        location_groups
      ON
        appointments.location_group_id = location_groups.id
      WHERE
        appointments.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable})
      AND
        location_groups.facility_id in (:facilityIds)
      AND
        appointment_schedules.updated_at_sync_tick > :since
    `;
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: 'appointments.patient_id',
        facilityId: 'location_groups.facility_id',
      }),
      joins: `
        JOIN appointments ON appointments.schedules_id = appointment_schedules.id
        JOIN location_groups ON appointments.location_group_id = location_groups.id
      `,
    };
  }
}
