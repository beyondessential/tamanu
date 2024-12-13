import { Sequelize } from 'sequelize';
import {
  APPOINTMENT_STATUSES,
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  isBefore,
  parseISO,
  set,
  startOfMonth,
} from 'date-fns';
import { toDateTimeString } from '../utils/dateTime';

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
        typeLegacy: { type: Sequelize.STRING, allowNull: true },
        isHighPriority: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  static getListReferenceAssociations() {
    return [
      { association: 'patient', include: ['village'] },
      'clinician',
      {
        association: 'location',
        include: ['locationGroup'],
      },
      'locationGroup',
      'appointmentType',
      'bookingType',
      'encounter',
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

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'bookingTypeId',
      as: 'bookingType',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'appointmentTypeId',
      as: 'appointmentType',
    });

    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.belongsTo(models.AppointmentSchedule, {
      foreignKey: 'scheduleId',
      as: 'schedule',
    });
  }

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    return `
      LEFT JOIN
        location_groups
      ON
        appointments.location_group_id = location_groups.id
      LEFT JOIN
        locations
      ON appointments.location_id = locations.id
      WHERE
        appointments.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable})
      AND
        COALESCE(location_groups.facility_id, locations.facility_id) IN (:facilityIds)
      AND
        appointments.updated_at_sync_tick > :since
    `;
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: `${this.tableName}.patient_id`,
        facilityId: 'COALESCE(location_groups.facility_id, locations.facility_id)',
      }),
      joins: `
        LEFT JOIN location_groups ON appointments.location_group_id = location_groups.id
        LEFT JOIN locations ON appointments.location_id = locations.id
      `,
    };
  }

  static async generateRepeatingAppointment(scheduleData, firstAppointmentData) {
    const MAX_GENERATED_APPOINTMENTS = 100;
    await this.sequelize.transaction(async () => {
      const schedule = await this.sequelize.models.AppointmentSchedule.create(scheduleData);

      const { interval, frequency, untilTime, nthWeekday, occurrenceCount } = schedule;
      const appointments = [{ ...firstAppointmentData, scheduleId: schedule.id }];

      const incrementByInterval = date => {
        const incrementedDate = toDateTimeString(
          add(parseISO(date), {
            [REPEAT_FREQUENCY_UNIT_PLURAL_LABELS[frequency]]: interval,
          }),
        );
        if (frequency === REPEAT_FREQUENCY.WEEKLY) {
          return incrementedDate;
        }
        if (frequency === REPEAT_FREQUENCY.MONTHLY) {
          // USE eachWeekdayOfMonth add to shared
          const matchingWeekdays = eachDayOfInterval({
            start: startOfMonth(incrementedDate),
            end: endOfMonth(incrementedDate),
          }).filter(day => day.getDay() === date.getDay());
          // Convert ordinal positioning to 0-based index but leave -1 as last occurrence
          const atIndex = Math.max(nthWeekday - 1, -1);
          return toDateTimeString(
            set(incrementedDate, { date: matchingWeekdays.at(atIndex).getDate() }),
          );
        }
      };

      const pushNextAppointment = () => {
        const currentAppointment = appointments.at(-1);
        appointments.push({
          ...currentAppointment,
          startTime: incrementByInterval(currentAppointment.startTime),
          endTime: incrementByInterval(currentAppointment.endTime),
        });
      };

      if (occurrenceCount) {
        for (let i = 0; i < Math.max(occurrenceCount, MAX_GENERATED_APPOINTMENTS); i++) {
          pushNextAppointment();
        }
      } else if (untilTime) {
        while (
          isBefore(parseISO(appointments.at(-1).startTime), parseISO(untilTime)) &&
          appointments.length <= MAX_GENERATED_APPOINTMENTS
        ) {
          pushNextAppointment();
        }
      }
    });
  }
}
