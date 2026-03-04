import { DataTypes, Op, type BelongsToGetAssociationMixin } from 'sequelize';
import { omit } from 'lodash';

import { APPOINTMENT_STATUSES, SYNC_DIRECTIONS } from '@tamanu/constants';
import type { ReadSettings } from '@tamanu/settings';

import { Model } from './Model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import { AppointmentSchedule, type AppointmentScheduleCreateData } from './AppointmentSchedule';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

interface CreateWithScheduleParams {
  appointmentData: AppointmentCreateData;
  settings: ReadSettings;
  scheduleData: AppointmentScheduleCreateData;
}

export type AppointmentCreateData = Omit<Appointment, 'id' | 'createdAt' | 'deletedAt'>;

export class Appointment extends Model {
  declare id: string;
  declare startTime: string;
  declare endTime?: string;
  declare status: string;
  declare typeLegacy?: string;
  declare isHighPriority: boolean;
  declare patientId?: string;
  declare clinicianId?: string;
  declare additionalClinicianId?: string;
  declare locationGroupId?: string;
  declare locationId?: string;
  declare bookingTypeId?: string;
  declare appointmentTypeId?: string;
  declare encounterId?: string;
  declare linkEncounterId?: string;
  declare scheduleId?: string;

  declare getSchedule: BelongsToGetAssociationMixin<AppointmentSchedule>;

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
      'additionalClinician',
      {
        association: 'location',
        include: ['locationGroup'],
      },
      'locationGroup',
      'appointmentType',
      'bookingType',
      'encounter',
      {
        association: 'linkEncounter',
        as: 'linkEncounter',
        include: [{
          association: 'location',
          include: ['facility'],
        }],
      },
      'schedule',
      {
        association: 'appointmentProcedureTypes',
        include: ['procedureType'],
        separate: true,
      },
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

    this.belongsTo(models.User, {
      as: 'additionalClinician',
      foreignKey: 'additionalClinicianId',
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

    this.belongsTo(models.Encounter, {
      foreignKey: 'linkEncounterId',
      as: 'linkEncounter',
    });

    this.belongsTo(models.AppointmentSchedule, {
      foreignKey: 'scheduleId',
      as: 'schedule',
    });

    this.hasMany(models.AppointmentProcedureType, {
      foreignKey: 'appointmentId',
      as: 'appointmentProcedureTypes',
    });

    this.belongsToMany(models.ReferenceData, {
      foreignKey: 'appointmentId',
      otherKey: 'procedureTypeId',
      as: 'procedureTypes',
      through: models.AppointmentProcedureType,
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

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildSyncLookupSelect(this, {
        patientId: `${this.tableName}.patient_id`,
        facilityId: 'COALESCE(location_groups.facility_id, locations.facility_id)',
      }),
      joins: `
        LEFT JOIN location_groups ON appointments.location_group_id = location_groups.id
        LEFT JOIN locations ON appointments.location_id = locations.id
      `,
    };
  }

  static async createWithSchedule({
    settings,
    appointmentData,
    scheduleData,
  }: CreateWithScheduleParams) {
    return this.sequelize.transaction(async () => {
      const schedule = await this.sequelize.models.AppointmentSchedule.create(scheduleData);
      const appointments = await schedule.generateRepeatingAppointment(settings, appointmentData);
      return { firstAppointment: appointments[0], schedule };
    });
  }

  /** Convert the appointment to a data object that can be used to create a new appointment. */
  toCreateData() {
    return omit(this.get({ plain: true }), [
      'id',
      'createdAt',
      'updatedAt',
    ]) as AppointmentCreateData;
  }

  async setProcedureTypes(procedureTypeIds: string[]) {
    const { AppointmentProcedureType } = this.sequelize.models;

    const uniqueProcedureTypeIds = [...new Set(procedureTypeIds || [])];

    if (uniqueProcedureTypeIds.length === 0) {
      await AppointmentProcedureType.destroy({
        where: { appointmentId: this.id },
      });
      return;
    }

    await AppointmentProcedureType.destroy({
      where: {
        appointmentId: this.id,
        procedureTypeId: {
          [Op.notIn]: uniqueProcedureTypeIds,
        },
      },
    });

    await AppointmentProcedureType.restore({
      where: {
        appointmentId: this.id,
        procedureTypeId: {
          [Op.in]: uniqueProcedureTypeIds,
        },
      },
    });

    await AppointmentProcedureType.bulkCreate(
      uniqueProcedureTypeIds.map(procedureTypeId => ({
        appointmentId: this.id,
        procedureTypeId,
      })),
      {
        ignoreDuplicates: true,
      },
    );
  }
}
