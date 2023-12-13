import { Op, Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, REGISTRATION_STATUSES } from '@tamanu/constants';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { Model } from './Model';

const GET_MOST_RECENT_REGISTRATIONS_QUERY = `
  (
    SELECT id
    FROM (
      SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY patient_id, program_registry_id ORDER BY date DESC, id DESC) AS row_num
      FROM patient_program_registrations
    ) n
    WHERE n.row_num = 1
  )
`;

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
          allowNull: false,
          type: Sequelize.TEXT,
          defaultValue: REGISTRATION_STATUSES.ACTIVE,
        },
        removedDate: dateTimeType('removedDate', {
          allowNull: true,
          defaultValue: null,
        }),
        clinicalStatusUpdatedAt: dateTimeType('clinicalStatusUpdatedAt', {
          allowNull: true,
          defaultValue: null,
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
      'registeringFacility',
      'facility',
      'village',
      'removedByClinician',
    ];
  }

  static getListReferenceAssociations() {
    return ['clinicalStatus', 'clinician'];
  }

  static initRelations(models) {
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
      foreignKey: 'clinicianId',
      as: 'clinician',
    });

    this.belongsTo(models.User, {
      foreignKey: 'removedByClinicianId',
      as: 'removedByClinician',
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
  }

  static async create(values) {
    const { programRegistryId, patientId, ...restOfUpdates } = values;
    const existingRegistration = await this.sequelize.models.PatientProgramRegistration.findOne({
      attributes: {
        // We don't want to override the defaults for the new record.
        exclude: ['id', 'updatedAt', 'updatedAtSyncTick'],
      },
      where: {
        programRegistryId,
        patientId,
      },
      order: [['date', 'DESC']],
      limit: 1,
      raw: true,
    });

    // console.log('***********************************');
    // console.log(
    //   'existingRegistration.clinicalStatusId ',
    //   existingRegistration?.clinicalStatusId,
    //   ' restOfUpdates.clinicalStatusId ',
    //   restOfUpdates?.clinicalStatusId,
    // );
    // console.log(existingRegistration.clinicalStatusId !== restOfUpdates.clinicalStatusId);
    // console.log({
    //   patientId,
    //   programRegistryId,
    //   ...(existingRegistration ?? {}),
    //   date: getCurrentDateTimeString(),
    //   ...restOfUpdates,
    //   ...(existingRegistration &&
    //   existingRegistration.clinicalStatusId !== restOfUpdates.clinicalStatusId
    //     ? {
    //         clinicalStatusUpdatedAt: getCurrentDateTimeString(),
    //       }
    //     : {}),
    //   ...(restOfUpdates.registrationStatus !== 'removed'
    //     ? {
    //         removedByClinicianId: null,
    //         removedDate: null,
    //       }
    //     : { removedDate: getCurrentDateTimeString() }),
    // });
    // console.log('***********************************');
    return super.create({
      patientId,
      programRegistryId,
      ...(existingRegistration ?? {}),
      // today's date should absolutely override the date of the previous registration record,
      // but if a date was provided in the function params, we should go with that.
      date: getCurrentDateTimeString(),
      ...restOfUpdates,
      ...(existingRegistration &&
      existingRegistration.clinicalStatusId !== restOfUpdates.clinicalStatusId
        ? {
            clinicalStatusUpdatedAt: getCurrentDateTimeString(),
          }
        : {}),
      ...(restOfUpdates.registrationStatus !== 'removed'
        ? {
            removedByClinicianId: null,
            removedDate: null,
          }
        : { removedDate: getCurrentDateTimeString() }),
    });
  }

  static async getMostRecentRegistrationsForPatient(patientId) {
    return this.sequelize.models.PatientProgramRegistration.findAll({
      where: {
        id: { [Op.in]: Sequelize.literal(GET_MOST_RECENT_REGISTRATIONS_QUERY) },
        registrationStatus: { [Op.ne]: REGISTRATION_STATUSES.RECORDED_IN_ERROR },
        patientId,
      },
      include: ['clinicalStatus', 'programRegistry'],
      order: [
        // "active" > "removed"
        ['registrationStatus', 'ASC'],
        [Sequelize.col('programRegistry.name'), 'ASC'],
      ],
    });
  }

  // syncs everywhere because for the pilot program,
  // the number of patients is guaranteed to be low.
  // https://github.com/beyondessential/tamanu/pull/4773#discussion_r1356087015
  static buildSyncFilter() {
    return null;
  }
}
