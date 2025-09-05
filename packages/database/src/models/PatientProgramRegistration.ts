import { Op, DataTypes, Sequelize } from 'sequelize';
import { REGISTRATION_STATUSES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class PatientProgramRegistration extends Model {
  declare id: string;
  declare date: string;
  declare registrationStatus: string;
  declare patientId: string;
  declare programRegistryId: string;
  declare clinicalStatusId?: string;
  declare clinicianId?: string;
  declare registeringFacilityId?: string;
  declare facilityId?: string;
  declare villageId?: string;
  declare deactivatedClinicianId?: string;
  declare deactivatedDate?: string;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          // patient_program_registration records use a generated primary key that enforces
          // one per patient and program registry, even across a distributed sync system
          type: `TEXT GENERATED ALWAYS AS (REPLACE("patient_id", ';', ':') || ';' || REPLACE("program_registry_id", ';', ':')) STORED`,
          set() {
            // any sets of the convenience generated "id" field can be ignored
          },
        },
        patientId: {
          type: DataTypes.STRING,
          primaryKey: true,
          references: {
            model: 'patients',
            key: 'id',
          },
        },
        programRegistryId: {
          type: DataTypes.STRING,
          primaryKey: true,
          references: {
            model: 'program_registries',
            key: 'id',
          },
        },
        date: dateTimeType('date', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        registrationStatus: {
          allowNull: false,
          type: DataTypes.TEXT,
          defaultValue: REGISTRATION_STATUSES.ACTIVE,
        },
        deactivatedDate: dateTimeType('deactivatedDate', {
          allowNull: true,
        }),
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static getFullReferenceAssociations() {
    return [
      'programRegistry',
      'clinicalStatus',
      'clinician',
      'deactivatedClinician',
      'registeringFacility',
      'facility',
      'village',
    ];
  }

  static getListReferenceAssociations() {
    return ['clinicalStatus', 'clinician', 'deactivatedClinician'];
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, {
      foreignKey: { name: 'patientId', allowNull: false },
      as: 'patient',
    });

    this.belongsTo(models.ProgramRegistry, {
      foreignKey: { name: 'programRegistryId', allowNull: false },
      as: 'programRegistry',
    });

    this.belongsTo(models.ProgramRegistryClinicalStatus, {
      foreignKey: 'clinicalStatusId',
      as: 'clinicalStatus',
    });

    this.belongsTo(models.User, {
      foreignKey: { name: 'clinicianId', allowNull: false },
      as: 'clinician',
    });

    this.belongsTo(models.User, {
      foreignKey: 'deactivatedClinicianId',
      as: 'deactivatedClinician',
    });

    this.belongsTo(models.Facility, {
      foreignKey: 'registeringFacilityId',
      as: 'registeringFacility',
    });

    // 1. Note that only one of facilityId or villageId will usually be set,
    // depending on the currentlyAtType of the related programRegistry.
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'villageId',
      as: 'village',
    });

    this.hasMany(models.PatientProgramRegistrationCondition, {
      foreignKey: 'patientProgramRegistrationId',
      as: 'conditions',
    });
  }

  static async getRegistrationsForPatient(patientId: string) {
    return this.sequelize.models.PatientProgramRegistration.findAll({
      where: {
        registrationStatus: { [Op.ne]: REGISTRATION_STATUSES.RECORDED_IN_ERROR },
        patientId,
      },
      include: ['clinicalStatus', 'programRegistry', 'deactivatedClinician'],
      order: [
        // "active" > "removed"
        ['registrationStatus', 'ASC'],
        [Sequelize.col('programRegistry.name'), 'ASC'],
      ],
    });
  }

  static buildSyncFilter() {
    return null;
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
