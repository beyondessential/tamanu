import { Sequelize, Op } from 'sequelize';
import { SYNC_DIRECTIONS, LAB_REQUEST_STATUSES, VACCINE_STATUS } from '@tamanu/constants';
import { getCovidClearanceCertificateFilter, getLabTestsFromLabRequests } from '../utils';
import { Model } from './Model';
import { dateType, dateTimeType } from './dateTimeTypes';
import { onSaveMarkPatientForSync } from './onSaveMarkPatientForSync';

export class Patient extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        displayId: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false,
        },
        firstName: Sequelize.STRING,
        middleName: Sequelize.STRING,
        lastName: Sequelize.STRING,
        culturalName: Sequelize.STRING,

        dateOfBirth: dateType('dateOfBirth'),
        dateOfDeath: dateTimeType('dateOfDeath'),

        sex: {
          type: Sequelize.ENUM('male', 'female', 'other'),
          allowNull: false,
        },
        email: Sequelize.STRING,
        visibilityStatus: Sequelize.STRING,
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
    onSaveMarkPatientForSync(this, 'id', 'afterSave');
  }

  static initRelations(models) {
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

    this.hasMany(models.PatientFieldValue, {
      foreignKey: 'patientId',
      as: 'fieldValues',
    });
  }

  static getFullReferenceAssociations() {
    return ['markedForSyncFacilities'];
  }

  async getAdministeredVaccines(queryOptions = {}) {
    const { models } = this.sequelize;
    const certifiableVaccineIds = await models.CertifiableVaccine.allVaccineIds();

    const { where: optWhere = {}, include = [], includeNotGiven = true, ...optRest } = queryOptions;

    if (include.length === 0) {
      include.push(
        {
          model: models.Encounter,
          as: 'encounter',
          include: models.Encounter.getFullReferenceAssociations(),
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

  async getCovidClearanceLabTests(queryOptions) {
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

  async getCovidLabTests(queryOptions) {
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
    return this.constructor.findOne({
      where: {
        [Op.and]: [
          { id: Sequelize.fn('any', Sequelize.fn('patients_merge_chain_up', this.id)) },
          { id: { [Op.ne]: this.id } },
          { mergedIntoId: null },
        ],
      },
    });
  }

  /** Patients this one was merged into */
  async getMergedUp() {
    return this.constructor.findAll({
      where: {
        [Op.and]: [
          { id: Sequelize.fn('any', Sequelize.fn('patients_merge_chain_up', this.id)) },
          { id: { [Op.ne]: this.id } },
        ],
      },
    });
  }

  /** Patients that were merged into this one */
  async getMergedDown() {
    return this.constructor.findAll({
      where: {
        [Op.and]: [
          { id: Sequelize.fn('any', Sequelize.fn('patients_merge_chain_down', this.id)) },
          { id: { [Op.ne]: this.id } },
        ],
      },
    });
  }

  async writeFieldValues(patientFields = {}) {
    const { PatientFieldValue } = this.constructor.sequelize.models;
    for (const [definitionId, value] of Object.entries(patientFields)) {
      // race condition doesn't matter because we take the last value anyway
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
}
