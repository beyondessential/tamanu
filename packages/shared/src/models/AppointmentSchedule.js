import { Sequelize } from 'sequelize';
import {
  APPOINTMENT_STATUSES,
  DAYS_OF_WEEK,
  REPEAT_FREQUENCY_VALUES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

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
          type: Sequelize.STRING,
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

  static buildSyncLookupQueryDetails() {
    // return {
    //   select: buildSyncLookupSelect(this, {
    //     patientId: `${this.tableName}.patient_id`,
    //     facilityId: 'location_groups.facility_id',
    //   }),
    //   joins: `
    //     JOIN location_groups ON appointments.location_group_id = location_groups.id
    //   `,
    // };
  }
}
