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

    return super.create({
      patientId,
      programRegistryId,
      ...(existingRegistration ?? {}),
      // today's date should absolutely override the date of the previous registration record,
      // but if a date was provided in the function params, we should go with that.
      date: getCurrentDateTimeString(),
      ...restOfUpdates,
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

  static buildPatientSyncFilter(patientIds, { syncTheseProgramRegistries }) {
    const escapedProgramRegistryIds = syncTheseProgramRegistries
      .map(id => this.sequelize.escape(id))
      .join(',');

    if (patientIds.length === 0) {
      return `WHERE program_registry_id IN (${escapedProgramRegistryIds}) AND updated_at_sync_tick > :since`;
    }

    return `WHERE (patient_id IN (:patientIds) OR program_registry_id IN (${escapedProgramRegistryIds})) AND updated_at_sync_tick > :since`;
  }
}
