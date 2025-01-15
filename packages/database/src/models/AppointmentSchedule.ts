import { isNumber, omit } from 'lodash';
import { DataTypes, type HasManyGetAssociationsMixin } from 'sequelize';

import {
  DAYS_OF_WEEK,
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS,
  REPEAT_FREQUENCY_VALUES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';

import { Model } from './Model';
import { dateTimeType } from './../types/model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import { InvalidOperationError } from '@tamanu/shared/errors';
import type { InitOptions, Models } from '../types/model';
import type { Appointment, AppointmentCreateData } from './Appointment';
import { parseISO, add, set, isAfter } from 'date-fns';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { weekdayAtOrdinalPosition } from '@tamanu/utils/appointmentScheduling';
import type { ReadSettings } from '@tamanu/settings';

export type AppointmentScheduleCreateData = Omit<
  AppointmentSchedule,
  'id' | 'createdAt' | 'deletedAt'
>;

export type WeeklySchedule = AppointmentSchedule & {
  frequency: typeof REPEAT_FREQUENCY.WEEKLY;
  daysOfWeek: [string];
};

export type MonthlySchedule = AppointmentSchedule & {
  frequency: typeof REPEAT_FREQUENCY.MONTHLY;
  daysOfWeek: [string];
  nthWeekday: number;
};

export type WeeklyOrMonthlySchedule = WeeklySchedule | MonthlySchedule;

/**
 * Schema to follow iCalendar standard for recurring events.
 * @see https://icalendar.org/iCalendar-RFC-5545/3-3-10-recurrence-rule.html
 */
export class AppointmentSchedule extends Model {
  declare id: string;
  declare startDate: string;
  declare untilDate?: string;
  declare interval: number;
  declare frequency: keyof typeof REPEAT_FREQUENCY;
  declare daysOfWeek?: [string];
  declare nthWeekday?: number;
  declare occurrenceCount?: number;
  declare isFullyGenerated: boolean;

  declare getAppointments: HasManyGetAssociationsMixin<Appointment>;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        startDate: dateTimeType('startDate', { allowNull: false }),
        untilDate: dateTimeType('untilDate', { allowNull: true }),
        interval: { type: DataTypes.INTEGER, allowNull: false },
        frequency: {
          type: DataTypes.ENUM(...REPEAT_FREQUENCY_VALUES),
          allowNull: false,
        },
        daysOfWeek: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
        },
        nthWeekday: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        occurrenceCount: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        isFullyGenerated: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        validate: {
          mustHaveEitherUntilDateOrOccurrenceCount() {
            if (!this.untilDate && !this.occurrenceCount) {
              throw new InvalidOperationError(
                'AppointmentSchedule must have either untilDate or occurrenceCount',
              );
            }
          },
          mustHaveOneWeekday() {
            const daysOfWeek = this.daysOfWeek as string[];
            if (
              daysOfWeek.length !== 1 ||
              (daysOfWeek[0] && !DAYS_OF_WEEK.includes(daysOfWeek[0]))
            ) {
              // Currently only supporting one weekday for recurring events
              throw new InvalidOperationError('AppointmentSchedule must have exactly one weekday');
            }
          },
          mustHaveNthWeekdayForMonthly() {
            if (this.frequency === REPEAT_FREQUENCY.MONTHLY && !isNumber(this.nthWeekday)) {
              throw new InvalidOperationError(
                'AppointmentSchedule must have nthWeekday for MONTHLY frequency',
              );
            }
          },
        },
      },
    );
  }

  static initRelations(models: Models) {
    this.hasMany(models.Appointment, {
      as: 'appointments',
      foreignKey: 'scheduleId',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return `
      JOIN
        appointments
      ON
        appointments.schedule_id = appointment_schedules.id
      LEFT JOIN
        location_groups
      ON
        appointments.location_group_id = location_groups.id
      LEFT JOIN
        locations
      ON
        appointments.location_id = locations.id
      WHERE
        appointments.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable})
      AND
        COALESCE(location_groups.facility_id, locations.facility_id) in (:facilityIds)
      AND
        appointment_schedules.updated_at_sync_tick > :since
    `;
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: 'appointments.patient_id',
        facilityId: 'COALESCE(location_groups.facility_id, locations.facility_id)',
      }),
      joins: `
        JOIN (
          SELECT DISTINCT ON (schedule_id) *
          FROM appointments
        ) appointments ON appointments.schedule_id = ${this.tableName}.id
        LEFT JOIN location_groups ON appointments.location_group_id = location_groups.id
        LEFT JOIN locations ON appointments.location_id = locations.id
      `,
    };
  }

  async generateRepeatingAppointment(
    settings: ReadSettings,
    initialAppointmentData?: AppointmentCreateData,
  ) {
    const maxRepeatingAppointmentsPerGeneration = (await settings.get(
      'appointments.maxRepeatingAppointmentsPerGeneration',
    )) as number;
    const { Appointment } = this.sequelize.models;
    const existingAppointments = await this.getAppointments({
      order: [['startTime', 'DESC']],
    });

    if (!initialAppointmentData && !existingAppointments) {
      throw new Error(
        'Cannot generate repeating appointments without initial appointment data or existing appointments',
      );
    }

    const { interval, frequency, untilDate, occurrenceCount, daysOfWeek, nthWeekday } =
      this as WeeklyOrMonthlySchedule;

    const appointments = initialAppointmentData
      ? [{ ...initialAppointmentData, scheduleId: this.id }]
      : ([] as AppointmentCreateData[]);

    const incrementByInterval = (date: string) => {
      const incrementedDate = add(parseISO(date), {
        [REPEAT_FREQUENCY_UNIT_PLURAL_LABELS[frequency] as string]: interval,
      });

      if (frequency === REPEAT_FREQUENCY.WEEKLY) {
        return toDateTimeString(incrementedDate) as string;
      }
      if (frequency === REPEAT_FREQUENCY.MONTHLY) {
        const [weekday] = daysOfWeek;
        const weekdayDate = weekdayAtOrdinalPosition(
          incrementedDate,
          weekday,
          nthWeekday,
        )?.getDate();
        // Set the date to the nth weekday of the month as incremented startTime will fall on a different weekday
        return toDateTimeString(
          set(incrementedDate, {
            date: weekdayDate,
          }),
        ) as string;
      }
      throw new Error('Invalid frequency when generating repeating appointments');
    };

    const pushNextAppointment = () => {
      // Get the last appointment or the initial appointment data
      const currentAppointment =
        appointments.at(-1) ||
        (omit(existingAppointments[0]!.get({ plain: true }), [
          'id',
          'createdAt',
          'updatedAt',
        ]) as AppointmentCreateData);
      const nextAppointment = {
        ...currentAppointment,
        startTime: incrementByInterval(currentAppointment.startTime),
        endTime: currentAppointment.endTime && incrementByInterval(currentAppointment.endTime),
      };
      appointments.push(nextAppointment);
      return nextAppointment;
    };

    let isFullyGenerated = false;
    const parsedUntilDate = untilDate && parseISO(untilDate);
    // Generate appointments until the limit is reached or until the
    // incremented startTime is after the untilDate
    while (appointments.length < maxRepeatingAppointmentsPerGeneration && !isFullyGenerated) {
      const { startTime: latestStartTime } = pushNextAppointment();

      if (parsedUntilDate) {
        const incrementedStartTime = parseISO(incrementByInterval(latestStartTime));
        if (!incrementedStartTime) throw new Error('No incremented start time found');
        isFullyGenerated = isAfter(incrementedStartTime, parsedUntilDate);
      } else if (occurrenceCount) {
        isFullyGenerated = appointments.length + existingAppointments.length === occurrenceCount;
      }
    }

    const appointmentData = await Appointment.bulkCreate(appointments);
    if (isFullyGenerated) {
      await this.update({ isFullyGenerated });
    }
    return appointmentData;
  }
}
