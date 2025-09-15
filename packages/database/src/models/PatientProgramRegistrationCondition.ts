import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { DataTypes } from 'sequelize';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import { buildSyncLookupSelect } from '../sync';

export class PatientProgramRegistrationCondition extends Model {
  declare id: string;
  declare date: string;
  declare deletionDate?: string;
  declare patientProgramRegistrationId: string;
  declare programRegistryConditionId?: string;
  declare programRegistryConditionCategoryId: string;
  declare clinicianId?: string;
  declare deletionClinicianId?: string;
  declare reasonForChange?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        date: dateTimeType('date', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        deletionDate: dateTimeType('deletionDate', {
          defaultValue: null,
        }),
        programRegistryConditionCategoryId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        reasonForChange: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.PatientProgramRegistration, {
      foreignKey: { name: 'patientProgramRegistrationId', allowNull: false },
      as: 'patientProgramRegistration',
    });

    this.belongsTo(models.ProgramRegistryCondition, {
      foreignKey: 'programRegistryConditionId',
      as: 'programRegistryCondition',
    });

    this.belongsTo(models.ProgramRegistryConditionCategory, {
      foreignKey: { name: 'programRegistryConditionCategoryId', allowNull: false },
      as: 'programRegistryConditionCategory',
    });

    this.belongsTo(models.User, {
      foreignKey: 'clinicianId',
      as: 'clinician',
    });

    this.belongsTo(models.User, {
      foreignKey: 'deletionClinicianId',
      as: 'deletionClinician',
    });
  }

  static getFullReferenceAssociations() {
    return ['programRegistryCondition', 'programRegistryConditionCategory'];
  }
  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }

    return `
      WHERE patient_program_registration_id IN (
        SELECT id
        FROM patient_program_registrations
        WHERE patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable})
      )
      AND ${this.tableName}.updated_at_sync_tick > :since
    `;
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildSyncLookupSelect(this, {
        patientId: 'patient_program_registrations.patient_id',
      }),
      joins: [
        `LEFT JOIN patient_program_registrations ON ${this.tableName}.patient_program_registration_id = patient_program_registrations.id`,
      ],
    };
  }
}
