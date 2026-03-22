import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

export class AppointmentProcedureType extends Model {
  declare id: string;
  declare appointmentId: string;
  declare procedureTypeId: string;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        appointmentId: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
            model: 'appointments',
            key: 'id',
          },
        },
        procedureTypeId: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
            model: 'reference_data',
            key: 'id',
          },
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Appointment, {
      foreignKey: 'appointmentId',
      as: 'appointment',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'procedureTypeId',
      as: 'procedureType',
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
        appointments.id = ${this.tableName}.appointment_id
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
        ${this.tableName}.updated_at_sync_tick > :since
    `;
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildSyncLookupSelect(this, {
        patientId: 'appointments.patient_id',
        facilityId: 'COALESCE(location_groups.facility_id, locations.facility_id)',
      }),
      joins: `
        JOIN appointments ON appointments.id = ${this.tableName}.appointment_id
        LEFT JOIN location_groups ON appointments.location_group_id = location_groups.id
        LEFT JOIN locations ON appointments.location_id = locations.id
      `,
    };
  }
}
