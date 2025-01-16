import { isNumber } from 'lodash';
import { DataTypes, type HasManyGetAssociationsMixin } from 'sequelize';
import { parseISO, add, set, isAfter, endOfDay } from 'date-fns';

import {
  DAYS_OF_WEEK,
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS,
  REPEAT_FREQUENCY_VALUES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { weekdayAtOrdinalPosition } from '@tamanu/utils/appointmentScheduling';
import type { ReadSettings } from '@tamanu/settings';

import { Model } from './Model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import type { Appointment, AppointmentCreateData } from './Appointment';
import { dateType } from './../types/model';
import type { InitOptions, Models } from '../types/model';

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
        untilDate: dateType('untilDate', { allowNull: true }),
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
          // Currently all implemented frequencies require a single weekday, multiple weekdays are currently not supported
          mustHaveOneWeekday() {
            const daysOfWeek = this.daysOfWeek as string[];
            if (
              daysOfWeek.length !== 1 ||
              (daysOfWeek[0] && !DAYS_OF_WEEK.includes(daysOfWeek[0]))
            ) {
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

  /**
   * Generate repeating appointments based on the schedule parameters and the initial appointment data.
   * When the generation is complete, the schedule is marked as fully generated.
   * Otherwise the schedule continues to generate via the scheduled task GenerateRepeatingAppointments
   * @param settings
   * @param initialAppointmentData Optional initial appointment data to start the generation
   */
  async generateRepeatingAppointment(
    settings: ReadSettings,
    initialAppointmentData?: AppointmentCreateData,
  ) {
    if (!this.sequelize.isInsideTransaction()) {
      throw new Error(
        'AppointmentSchedule.generateRepeatingAppointment must always run inside a transaction',
      );
    }
    const maxRepeatingAppointmentsPerGeneration = await settings.get<number>(
      'appointments.maxRepeatingAppointmentsPerGeneration',
    );
    const { Appointment } = this.sequelize.models;
    const existingAppointments = await this.getAppointments({
      order: [['startTime', 'DESC']],
    });
    const latestExistingAppointment = existingAppointments[0];

    if (!(initialAppointmentData || latestExistingAppointment)) {
      throw new Error(
        'Cannot generate repeating appointments without initial appointment data or existing appointments within the schedule',
      );
    }

    const { interval, frequency, untilDate, occurrenceCount, daysOfWeek, nthWeekday } =
      this as WeeklyOrMonthlySchedule;
    const parsedUntilDate = untilDate && endOfDay(parseISO(untilDate));

    const appointments: AppointmentCreateData[] = [];

    if (initialAppointmentData) {
      // Add the initial appointment data to the list of appointments to generate and to act
      // as a reference for incremented appointments
      appointments.push({ ...initialAppointmentData, scheduleId: this.id });
    }

    const adjustDateForFrequency = (date: Date) => {
      if (frequency === REPEAT_FREQUENCY.MONTHLY) {
        // Set the date to the nth weekday of the month i.e 3rd Monday
        const weekdayDate = weekdayAtOrdinalPosition(date, daysOfWeek[0], nthWeekday);
        if (!weekdayDate) throw new Error('No weekday date found');
        return set(date, {
          date: weekdayDate.getDate(),
        });
      }
      return date;
    };

    const incrementDateString = (date: string) => {
      const incrementedDate = add(parseISO(date), {
        [REPEAT_FREQUENCY_UNIT_PLURAL_LABELS[frequency]]: interval,
      });
      return toDateTimeString(adjustDateForFrequency(incrementedDate)) as string;
    };

    const pushNextAppointment = () => {
      // Get the most recent appointment or start off where the last generation left off
      const lastAppointment = appointments.at(-1) || latestExistingAppointment!.toCreateData();
      appointments.push({
        ...lastAppointment,
        startTime: incrementDateString(lastAppointment.startTime),
        endTime: lastAppointment.endTime && incrementDateString(lastAppointment.endTime),
      });
    };

    const checkComplete = () => {
      // Generation is considered complete if the next appointments startTime falls after the untilDate
      const nextAppointmentAfterUntilDate =
        parsedUntilDate &&
        isAfter(parseISO(incrementDateString(appointments.at(-1)!.startTime)), parsedUntilDate);
      // Or if the occurrenceCount is reached
      const hasReachedOccurrenceCount =
        occurrenceCount && appointments.length + existingAppointments.length === occurrenceCount;
      return nextAppointmentAfterUntilDate || hasReachedOccurrenceCount;
    };

    let isFullyGenerated = false;
    for (let i = 0; i + 1 < maxRepeatingAppointmentsPerGeneration; i++) {
      pushNextAppointment();
      if (checkComplete()) {
        isFullyGenerated = true;
        break;
      }
    }

    const appointmentData = await Appointment.bulkCreate(appointments);
    if (isFullyGenerated) {
      await this.update({ isFullyGenerated });
    }
    return appointmentData;
  }
}
