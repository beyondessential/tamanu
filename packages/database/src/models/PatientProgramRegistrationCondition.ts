import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class PatientProgramRegistrationCondition extends Model {
  id!: string;
  date!: string;
  deletionDate?: string;
  patientId?: string;
  programRegistryId?: string;
  programRegistryConditionId?: string;
  clinicianId?: string;
  deletionClinicianId?: string;

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
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    // Note that we use a kind of composite foreign key here (patientId + programRegistryId)
    // rather than just a single patientProgramRegistrationId. This is because
    // PatientProgramRegistrion is an append-only array rather than a single record,
    // so the relevant id changes every time a change is made to the relevant registration.
    this.belongsTo(models.Patient, {
      foreignKey: { name: 'patientId', allowNull: false },
      as: 'patient',
    });
    this.belongsTo(models.ProgramRegistry, {
      foreignKey: { name: 'programRegistryId', allowNull: false },
      as: 'programRegistry',
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
