import { Op, DataTypes, type FindOptions, Sequelize } from 'sequelize';
import { LAB_REQUEST_STATUSES, SYNC_DIRECTIONS, VACCINE_STATUS } from '@tamanu/constants';
import {
  getCovidClearanceCertificateFilter,
  getLabTestsFromLabRequests,
} from '@tamanu/shared/utils';
import { Model } from './Model';
import type { PatientAdditionalData } from './PatientAdditionalData';
import { resolveDuplicatedPatientDisplayIds } from '../sync/resolveDuplicatedPatientDisplayIds';

import { dateTimeType, dateType, type InitOptions, type Models } from '../types/model';
import type { SyncHookSnapshotChanges, SyncSnapshotAttributes } from 'types/sync';

export class Patient extends Model {
  declare id: string;
  declare displayId: string;
  declare firstName?: string;
  declare middleName?: string;
  declare lastName?: string;
  declare culturalName?: string;
  declare dateOfBirth?: string;
  declare dateOfDeath?: string;
  declare sex: string;
  declare email?: string;
  declare villageId?: string;
  declare visibilityStatus?: string;
  declare mergedIntoId?: string;
  declare additionalData?: PatientAdditionalData[];

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        displayId: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: false,
        },
        firstName: DataTypes.STRING,
        middleName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        culturalName: DataTypes.STRING,

        dateOfBirth: dateType('dateOfBirth'),
        dateOfDeath: dateTimeType('dateOfDeath'),

        sex: {
          type: DataTypes.ENUM('male', 'female', 'other'),
          allowNull: false,
        },
        email: DataTypes.STRING,
        visibilityStatus: DataTypes.STRING,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        indexes: [
          { fields: ['date_of_death'] },
          { fields: ['display_id'] },
          { fields: ['last_name'] },
        ],
      },
    );
  }

  static initRelations(models: Models) {
    this.hasMany(models.Encounter, {
      foreignKey: 'patientId',
    });

    // technically these two relations are hasOne but this just describes
    // "there is another table referencing this one by id"
    this.hasMany(models.PatientAdditionalData, {
      foreignKey: 'patientId',
      as: 'additionalData',
    });
    this.hasMany(models.PatientDeathData, {
      foreignKey: 'patientId',
      as: 'deathData',
    });
    this.hasMany(models.PatientBirthData, {
      foreignKey: 'patientId',
      as: 'birthData',
    });

    this.hasMany(models.PatientSecondaryId, {
      foreignKey: 'patientId',
      as: 'secondaryIds',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'villageId',
      as: 'village',
    });

    this.hasMany(models.Patient, {
      foreignKey: 'mergedIntoId',
      as: 'mergedPatients',
    });

    this.hasMany(models.Note, {
      foreignKey: 'recordId',
      as: 'notes',
      constraints: false,
      scope: {
        recordType: this.name,
      },
    });

    this.belongsToMany(models.Facility, {
      through: 'PatientFacility',
      as: 'markedForSyncFacilities',
    });

    this.belongsToMany(models.Prescription, {
      through: models.PatientOngoingPrescription,
      foreignKey: 'patientId',
      as: 'ongoingPrescriptions',
    });

    this.hasMany(models.PatientFieldValue, {
      foreignKey: 'patientId',
      as: 'fieldValues',
    });

    this.hasMany(models.PatientProgramRegistration, {
      foreignKey: 'patientId',
      as: 'patientProgramRegistrations',
    });

    this.hasMany(models.PatientContact, {
      foreignKey: 'patientId',
      as: 'contacts',
    });

    this.hasOne(models.PortalUser, {
      foreignKey: 'patientId',
      as: 'portalUser',
    });
  }

  static getFullReferenceAssociations() {
    return ['markedForSyncFacilities', 'fieldValues', 'portalUser'];
  }

  async getAdministeredVaccines(
    queryOptions: { where?: any; include?: any[]; includeNotGiven?: any } = {},
  ) {
    const { models } = this.sequelize;
    const certifiableVaccineIds = await models.CertifiableVaccine.allVaccineIds();

    const { where: optWhere = {}, include = [], includeNotGiven = true, ...optRest } = queryOptions;

    if (include.length === 0) {
      include.push(
        {
          model: models.Encounter,
          as: 'encounter',
          include: [
            {
              model: models.Location,
              as: 'location',
              include: [
                {
                  model: models.Facility,
                  as: 'facility',
                },
              ],
            },
          ],
        },
        {
          model: models.Location,
          as: 'location',
          include: ['locationGroup', 'facility'],
        },
        {
          model: models.Department,
          as: 'department',
        },
        {
          model: models.User,
          as: 'recorder',
        },
        {
          model: models.ReferenceData,
          as: 'notGivenReason',
        },
      );
    }

    if (!include.some(i => i.as === 'scheduledVaccine')) {
      include.push({
        model: models.ScheduledVaccine,
        as: 'scheduledVaccine',
        include: models.ScheduledVaccine.getListReferenceAssociations(),
      });
    }

    const { count, rows } = await models.AdministeredVaccine.findAndCountAll({
      order: [['date', 'DESC']],
      ...optRest,
      include,
      where: {
        '$encounter.patient_id$': this.id,
        status: JSON.parse(includeNotGiven)
          ? { [Op.in]: [VACCINE_STATUS.GIVEN, VACCINE_STATUS.NOT_GIVEN] }
          : VACCINE_STATUS.GIVEN,
        ...optWhere,
      },
    });

    const data = rows.map(x => x.get({ plain: true }));

    for (const record of data) {
      if (certifiableVaccineIds.includes(record.scheduledVaccine.vaccineId)) {
        record.certifiable = true;
      }
    }

    return { count, data };
  }

  async getCovidClearanceLabTests(queryOptions: FindOptions<any> | undefined) {
    const labRequests = await this.sequelize.models.LabRequest.findAll({
      raw: true,
      nest: true,
      ...queryOptions,
      where: await getCovidClearanceCertificateFilter(this.sequelize.models),
      include: [
        {
          association: 'category',
        },
        ...this.getLabTestBaseIncludes(),
      ],
    });

    return getLabTestsFromLabRequests(labRequests);
  }

  async getCovidLabTests(queryOptions: FindOptions<any> | undefined) {
    const labRequests = await this.sequelize.models.LabRequest.findAll({
      raw: true,
      nest: true,
      ...queryOptions,
      where: { status: LAB_REQUEST_STATUSES.PUBLISHED },
      include: [
        {
          association: 'category',
          where: { name: Sequelize.literal("UPPER(category.name) LIKE ('%COVID%')") },
        },
        ...this.getLabTestBaseIncludes(),
      ],
    });

    return getLabTestsFromLabRequests(labRequests);
  }

  getLabTestBaseIncludes() {
    return [
      { association: 'requestedBy' },
      {
        association: 'tests',
        include: [{ association: 'labTestMethod' }, { association: 'labTestType' }],
      },
      { association: 'laboratory' },
      {
        association: 'encounter',
        required: true,
        include: [
          { association: 'examiner' },
          {
            association: 'patient',
            where: { id: this.id },
          },
        ],
      },
    ];
  }

  /** Patient this one was merged into (end of the chain) */
  async getUltimateMergedInto() {
    return (this.constructor as typeof Patient).findOne({
      where: {
        [Op.and]: [
          { id: Sequelize.fn('any', Sequelize.fn('patients_merge_chain_up', this.id)) },
          { id: { [Op.ne]: this.id } },
          { mergedIntoId: null },
        ],
      },
      paranoid: false,
    });
  }

  /** Patients this one was merged into */
  async getMergedUp() {
    return (this.constructor as typeof Patient).findAll({
      where: {
        [Op.and]: [
          { id: Sequelize.fn('any', Sequelize.fn('patients_merge_chain_up', this.id)) },
          { id: { [Op.ne]: this.id } },
        ],
      },
      paranoid: false,
    });
  }

  /** Patients that were merged into this one */
  async getMergedDown() {
    return (this.constructor as typeof Patient).findAll({
      where: {
        [Op.and]: [
          { id: Sequelize.fn('any', Sequelize.fn('patients_merge_chain_down', this.id)) },
          { id: { [Op.ne]: this.id } },
        ],
      },
      paranoid: false,
    });
  }

  async writeFieldValues(patientFields = {}) {
    const { PatientFieldValue, PatientFieldDefinition } = (this.constructor as typeof Patient)
      .sequelize.models;
    for (const [definitionId, value] of Object.entries(patientFields)) {
      // race condition doesn't matter because we take the last value anyway
      const fieldDefinition = await PatientFieldDefinition.findByPk(definitionId);
      if (!fieldDefinition) {
        throw new Error(
          `Custom patient field ${definitionId} not found. Please contact your administrator.`,
        );
      }
      const field = await PatientFieldValue.findOne({
        where: {
          definitionId,
          patientId: this.id,
        },
        order: [['updatedAt', 'DESC']],
      });
      if (field) {
        await field.update({ value });
      } else {
        await PatientFieldValue.create({ value, definitionId, patientId: this.id });
      }
    }
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }

  static async incomingSyncHook(
    changes: SyncSnapshotAttributes[],
  ): Promise<SyncHookSnapshotChanges | undefined> {
    return resolveDuplicatedPatientDisplayIds(this, changes);
  }
}
