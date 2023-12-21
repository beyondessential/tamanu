import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { Model } from './Model';

export class PatientProgramRegistrationCondition extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        date: dateTimeType('date', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        deletionStatus: {
          type: Sequelize.TEXT,
          defaultValue: null,
        },
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

  static initRelations(models) {

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

  // syncs everywhere because for the pilot program,
  // the number of patients is guaranteed to be low.
  // https://github.com/beyondessential/tamanu/pull/4773#discussion_r1356087015
  static buildSyncFilter() {
    return null;
  }
}
