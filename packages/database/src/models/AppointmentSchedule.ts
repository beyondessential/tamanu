import { isMatch, isNumber, omit } from 'lodash';
import { DataTypes, Op, type HasManyGetAssociationsMixin } from 'sequelize';
import { parseISO, add, set, isAfter, endOfDay } from 'date-fns';

import {
  APPOINTMENT_STATUSES,
  DAYS_OF_WEEK,
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS,
  REPEAT_FREQUENCY_VALUES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { weekdayAtOrdinalPosition } from '@tamanu/utils/appointmentScheduling';
import type { ReadSettings } from '@tamanu/settings/reader';

import { Model } from './Model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import type { Appointment, AppointmentCreateData } from './Appointment';
import { dateType } from './../types/model';
import type { InitOptions, Models } from '../types/model';
import type { SyncHookSnapshotChanges, SyncSnapshotAttributes } from 'types/sync';
import { resolveAppointmentSchedules } from '../sync/resolveAppointmentSchedules';

export type AppointmentScheduleCreateData = Omit<
  AppointmentSchedule,
  'id' | 'createdAt' | 'deletedAt' | 'updatedAtSyncTick'
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

/**
 * Schema to follow iCalendar standard for recurring events.
 * @see https://icalendar.org/iCalendar-RFC-5545/3-3-10-recurrence-rule.html
 */
export class AppointmentSchedule extends Model {
  declare id: string;
  declare untilDate?: string;
  declare generatedUntilDate?: string;
  declare cancelledAtDate?: string;
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
        generatedUntilDate: dateType('generatedUntilDate', { allowNull: true }),
        cancelledAtDate: dateType('cancelledAtDate', { allowNull: true }),
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

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildSyncLookupSelect(this, {
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

  static async incomingSyncHook(
    changes: SyncSnapshotAttributes[],
  ): Promise<SyncHookSnapshotChanges | undefined> {
    return resolveAppointmentSchedules(this, changes);
  }

  isDifferentFromSchedule(scheduleData: AppointmentScheduleCreateData) {
    const toComparable = (schedule: AppointmentScheduleCreateData) =>
      omit(schedule, ['createdAt', 'updatedAt', 'updatedAtSyncTick', 'id']);
    return !isMatch(toComparable(this.get({ plain: true })), toComparable(scheduleData));
  }

  /**
   * End the schedule at the given appointment.
   * This will cancel all appointments starting from the given appointment.
   * The schedule will then be marked as fully generated and the untilDate will be set to the
   * startTime of the latest non-cancelled appointment.
   * @param appointment All appointments starting from this appointment will be cancelled
   */
  async endAtAppointment(appointment: Appointment) {
    const { models } = this.sequelize;
    if (!this.sequelize.isInsideTransaction()) {
      throw new Error('AppointmentSchedule.endAtAppointment must always run inside a transaction');
    }
    await models.Appointment.update(
      {
        status: APPOINTMENT_STATUSES.CANCELLED,
      },
      {
        where: {
          startTime: { [Op.gte]: appointment.startTime },
          scheduleId: this.id,
        },
      },
    );
    const [previousAppointment] = await this.getAppointments({
      order: [['startTime', 'DESC']],
      limit: 1,
      where: {
        status: {
          [Op.not]: APPOINTMENT_STATUSES.CANCELLED,
        },
      },
    });
    const updatedSchedule = await this.update({
      isFullyGenerated: true,
      cancelledAtDate: previousAppointment ? previousAppointment.startTime : appointment.startTime,
    });
    return updatedSchedule;
  }

  /**
   * Modify all appointments starting from the given appointment.
   * @param appointment The appointment to start modifying from
   * @param appointmentData The data to update the appointments with
   */
  async modifyFromAppointment(appointment: Appointment, appointmentData: AppointmentCreateData) {
    const { models } = this.sequelize;
    return models.Appointment.update(appointmentData, {
      where: {
        startTime: {
          [Op.gte]: appointment.startTime, // current and future appointments
        },
        scheduleId: this.id,
      },
    });
  }

  /**
   * Generate repeating appointments based on the schedule parameters and the initial appointment data.
   * When the generation is complete, the schedule is marked as fully generated.
   * Otherwise the schedule continues to generate via the scheduled task GenerateRepeatingAppointments
   * @param settings Settings reader
   * @param initialAppointmentData Optional initial appointment data to start the generation
   */
  async generateRepeatingAppointment(
    settings: ReadSettings,
    initialAppointmentData?: AppointmentCreateData,
  ) {
    const { models } = this.sequelize;
    if (!this.sequelize.isInsideTransaction()) {
      throw new Error(
        'AppointmentSchedule.generateRepeatingAppointment must always run inside a transaction',
      );
    }
    const maxRepeatingAppointmentsPerGeneration = await settings.get<number>(
      'appointments.maxRepeatingAppointmentsPerGeneration',
    );
    const existingAppointments = await this.getAppointments({
      order: [['startTime', 'DESC']],
      where: {
        status: {
          [Op.not]: APPOINTMENT_STATUSES.CANCELLED,
        },
      },
    });
    const latestExistingAppointment = existingAppointments[0];

    if (!(initialAppointmentData || latestExistingAppointment)) {
      throw new Error(
        'Cannot generate repeating appointments without initial appointment data or existing appointments within the schedule',
      );
    }

    const { interval, frequency, untilDate, occurrenceCount, daysOfWeek, nthWeekday } = this as
      | WeeklySchedule
      | MonthlySchedule;
    const parsedUntilDate = untilDate && endOfDay(parseISO(untilDate));

    const appointmentsToCreate: AppointmentCreateData[] = [];

    if (initialAppointmentData) {
      // Add the initial appointment data to the list of appointments to generate and to act
      // as a reference for incremented appointments
      appointmentsToCreate.push({ ...initialAppointmentData, scheduleId: this.id });
    }

    const adjustDateForFrequency = (date: Date) => {
      if (frequency === REPEAT_FREQUENCY.MONTHLY) {
        // Set the date to the nth weekday of the month i.e 3rd Monday
        return set(date, {
          date: weekdayAtOrdinalPosition(date, daysOfWeek[0], nthWeekday)!.getDate(),
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
      const referenceAppointment =
        appointmentsToCreate.at(-1) || latestExistingAppointment!.toCreateData();
      appointmentsToCreate.push({
        ...referenceAppointment,
        startTime: incrementDateString(referenceAppointment.startTime),
        endTime: referenceAppointment.endTime && incrementDateString(referenceAppointment.endTime),
      });
    };

    const checkFullyGenerated = () => {
      // Generation is considered complete if the next appointments startTime falls after the untilDate
      const nextAppointmentAfterUntilDate =
        parsedUntilDate &&
        isAfter(
          parseISO(incrementDateString(appointmentsToCreate.at(-1)!.startTime)),
          parsedUntilDate,
        );
      // Or if the occurrenceCount is reached
      const hasReachedOccurrenceCount =
        occurrenceCount &&
        appointmentsToCreate.length + existingAppointments.length === occurrenceCount;
      return nextAppointmentAfterUntilDate || hasReachedOccurrenceCount;
    };

    let isFullyGenerated = false;
    // If initial appointment data has been preloaded in appointment array start generating from i = 1
    for (let i = appointmentsToCreate.length; i < maxRepeatingAppointmentsPerGeneration; i++) {
      pushNextAppointment();
      if (checkFullyGenerated()) {
        isFullyGenerated = true;
        break;
      }
    }

    const appointments = await models.Appointment.bulkCreate(appointmentsToCreate);
    await this.update({
      isFullyGenerated,
      generatedUntilDate: appointments.at(-1)!.startTime,
    });

    return appointments;
  }
}
