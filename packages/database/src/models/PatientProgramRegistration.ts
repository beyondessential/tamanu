import { Op, DataTypes, Sequelize } from 'sequelize';
import { REGISTRATION_STATUSES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class PatientProgramRegistration extends Model {
  declare id: string;
  declare date: string;
  declare registrationStatus: string;
  declare isMostRecent: boolean;
  declare patientId: string;
  declare programRegistryId: string;
  declare clinicalStatusId?: string;
  declare clinicianId?: string;
  declare registeringFacilityId?: string;
  declare facilityId?: string;
  declare villageId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        date: dateTimeType('date', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        registrationStatus: {
          allowNull: false,
          type: DataTypes.TEXT,
          defaultValue: REGISTRATION_STATUSES.ACTIVE,
        },
        isMostRecent: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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

  static async create(values: any): Promise<any> {
    const { programRegistryId, patientId, ...restOfUpdates } = values;
    const existingRegistration = await this.sequelize.models.PatientProgramRegistration.findOne({
      where: {
        isMostRecent: true,
        programRegistryId,
        patientId,
      },
    });

    // Most recent registration will now be the new one
    if (existingRegistration) {
      await existingRegistration.update({ isMostRecent: false });
    }

    const newRegistrationValues = {
      patientId,
      programRegistryId,
      ...(existingRegistration?.dataValues ?? {}),
      // today's date should absolutely override the date of the previous registration record,
      // but if a date was provided in the function params, we should go with that.
      date: getCurrentDateTimeString(),
      ...restOfUpdates,
      isMostRecent: true,
    };

    // Ensure a new id is generated, rather than using the one from existingRegistration
    delete newRegistrationValues.id;

    return super.create(newRegistrationValues);
  }

  static async getMostRecentRegistrationsForPatient(patientId: string) {
    return this.sequelize.models.PatientProgramRegistration.findAll({
      where: {
        isMostRecent: true,
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

  static buildSyncFilter() {
    return null;
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
