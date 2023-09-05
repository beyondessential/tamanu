import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, REGISTRATION_STATUSES } from '@tamanu/constants';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { Model } from './Model';

export class PatientProgramRegistration extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        date: dateTimeType('date', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        registrationStatus: {
          type: Sequelize.TEXT,
          defaultValue: REGISTRATION_STATUSES.ACTIVE,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.ProgramRegistry, {
      foreignKey: 'programRegistryId',
      as: 'programRegistry',
    });
    this.belongsTo(models.ProgramRegistryClinicalStatus, {
      foreignKey: 'clinicalStatusId',
      as: 'clinicalStatus',
    });

    this.belongsTo(models.User, {
      foreignKey: 'clinicianId',
      as: 'clinician',
    });

    this.belongsTo(models.Facility, {
      foreignKey: 'registeringFacilityId',
      as: 'registeringFacility',
    });

    // 1. Note that only one of facilityId or villageId will usually be set,
    // depending on the currentlyAtType of the related programRegistry.
    // 2. The first entry in a patient's registration list for a given program
    // registry may have both facilityId and villageId - for the registering facility
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'villageId',
      as: 'village',
    });
  }

  static getListReferenceAssociations() {
    return [
      'patient',
      'village',
      'facility',
      'registeringFacility',
      'clinician',
      'clinicalStatus',
      'programRegistry',
    ];
  }
}
