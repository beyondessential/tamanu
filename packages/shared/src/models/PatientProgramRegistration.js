import { Op, Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, REGISTRATION_STATUSES } from '@tamanu/constants';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { Model } from './Model';

export const GET_MOST_RECENT_REGISTRATIONS_QUERY = `
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

  static async create(values) {
    const { programRegistryId, patientId, ...restOfUpdates } = values;
    const existingRegistration = await this.sequelize.models.PatientProgramRegistration.findOne({
      attributes: {
        // We don't want to override the defaults for the new record.
        exclude: ['id', 'updatedAt', 'updatedAtSyncTick'],
      },
      where: {
        id: { [Op.in]: Sequelize.literal(GET_MOST_RECENT_REGISTRATIONS_QUERY) },
        programRegistryId,
        patientId,
      },
      raw: true,
    });

    return super.create({
      patientId,
      programRegistryId,
      ...(existingRegistration ?? {}),
      ...restOfUpdates,
    });
  }
}
