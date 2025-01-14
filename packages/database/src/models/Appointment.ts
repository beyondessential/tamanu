import config from 'config';
import { DataTypes } from 'sequelize';
import {
  APPOINTMENT_STATUSES,
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type ModelProperties, type Models } from '../types/model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import { add, isAfter, parseISO, set } from 'date-fns';
import { omit } from 'lodash';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { weekdayAtOrdinalPosition } from '@tamanu/utils/appointmentScheduling';
import {
  type AppointmentScheduleCreateData,
  type WeeklyOrMonthlySchedule,
} from './AppointmentSchedule';

type AppointmentCreateData = Omit<Appointment, 'id' | 'createdAt' | 'deletedAt'>;

export class Appointment extends Model {
  declare id: string;
  declare startTime: string;
  declare endTime?: string;
  declare status: string;
  declare typeLegacy?: string;
  declare isHighPriority: boolean;
  declare patientId?: string;
  declare clinicianId?: string;
  declare locationGroupId?: string;
  declare locationId?: string;
  declare bookingTypeId?: string;
  declare appointmentTypeId?: string;
  declare encounterId?: string;
  declare scheduleId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        startTime: dateTimeType('startTime', { allowNull: false }),
        endTime: dateTimeType('endTime'),
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: APPOINTMENT_STATUSES.CONFIRMED,
        },
        typeLegacy: { type: DataTypes.STRING, allowNull: true },
        isHighPriority: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
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

  static initRelations(models: Models) {
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

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
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

  static async createWithSchedule(
    appointmentData: AppointmentCreateData,
    scheduleData: AppointmentScheduleCreateData,
  ) {
    return this.sequelize.transaction(async () => {
      const schedule = await this.sequelize.models.AppointmentSchedule.create(scheduleData);
      const appointment = await this.create({ ...appointmentData, scheduleId: schedule.id });
      return this.generateRepeatingAppointment(schedule as WeeklyOrMonthlySchedule, appointment);
    });
  }

  /**
   * @param schedule appointmentSchedule instance
   * @param baseAppointment base appointment instance that the repeating appointments will be incremental created from
   * @param existingAppointmentCount The total number of appointments that already exist for the schedule at time of generation
   * In case of continued generation, this will be the count of appointments that were generated in the previous batch
   * And in the case of initial generation, this will be 1 for the base appointment
   */
  static async generateRepeatingAppointment(
    schedule: WeeklyOrMonthlySchedule,
    baseAppointment: Appointment,
    existingAppointmentCount: number = 1,
  ) {
    const { maxInitialRepeatingAppointments } = config?.appointments || {};
    const { interval, frequency, untilDate, occurrenceCount } = schedule;
    const baseAppointmentCreateData = omit(baseAppointment.get({ plain: true }), [
      'id',
      'createdAt',
      'updatedAt',
    ]) as AppointmentCreateData;
    const appointments = [] as ModelProperties<AppointmentCreateData>[];

    const incrementByInterval = (date: string) => {
      const incrementedDate = add(parseISO(date), {
        [REPEAT_FREQUENCY_UNIT_PLURAL_LABELS[frequency] as string]: interval,
      });

      if (schedule.frequency === REPEAT_FREQUENCY.WEEKLY) {
        return toDateTimeString(incrementedDate) as string;
      }
      if (schedule.frequency === REPEAT_FREQUENCY.MONTHLY) {
        const { nthWeekday, daysOfWeek } = schedule;
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
      const currentAppointment = appointments.at(-1) || baseAppointmentCreateData;
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
    while (
      appointments.length + existingAppointmentCount < maxInitialRepeatingAppointments &&
      !isFullyGenerated
    ) {
      const { startTime: latestStartTime } = pushNextAppointment();

      if (parsedUntilDate) {
        const incrementedStartTime = parseISO(incrementByInterval(latestStartTime));
        if (!incrementedStartTime) throw new Error('No incremented start time found');
        isFullyGenerated = isAfter(incrementedStartTime, parsedUntilDate);
      } else if (occurrenceCount) {
        isFullyGenerated = appointments.length + existingAppointmentCount === occurrenceCount;
      }
    }

    const appointmentData = await this.bulkCreate(appointments);
    if (isFullyGenerated) {
      await schedule.update({ isFullyGenerated });
    }
    return appointmentData;
  }
}
