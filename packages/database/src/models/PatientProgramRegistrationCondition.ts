import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { DataTypes } from 'sequelize';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class PatientProgramRegistrationCondition extends Model {
  declare id: string;
  declare date: string;
  declare deletionDate?: string;
  declare patientProgramRegistrationId: string;
  declare programRegistryConditionId?: string;
  declare clinicianId?: string;
  declare deletionClinicianId?: string;
  declare conditionCategory?: string;
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
        conditionCategory: {
          type: DataTypes.STRING,
          defaultValue: 'Unknown',
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
    return ['programRegistryCondition'];
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }

    return `WHERE patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable}) AND updated_at_sync_tick > :since`;
  }

  static buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }
}
