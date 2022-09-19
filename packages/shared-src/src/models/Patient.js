import { Sequelize } from 'sequelize';
import config from 'config';
import { SYNC_DIRECTIONS, LAB_REQUEST_STATUSES } from 'shared/constants';
import { dateTimeType } from './dateTimeTypes';
import { Model } from './Model';

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

        dateOfBirth: Sequelize.DATE,
        dateOfDeath: dateTimeType('dateOfDeath'),
        sex: {
          type: Sequelize.ENUM('male', 'female', 'other'),
          allowNull: false,
        },
        email: Sequelize.STRING,
        markedForSync: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        visibilityStatus: Sequelize.STRING,
      },
      {
        ...options,
        syncConfig: {
          syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
          includedRelations: config.sync?.embedPatientNotes
            ? ['notePages', 'notePages.noteItems']
            : [],
        },
        indexes: [
          { fields: ['date_of_death'] },
          { fields: ['display_id'] },
          { fields: ['last_name'] },
        ],
      },
    );
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

    this.hasMany(models.NotePage, {
      foreignKey: 'recordId',
      as: 'notePages',
      constraints: false,
      scope: {
        recordType: this.name,
      },
    });
  }

  static async getSyncIds() {
    const patients = await this.sequelize.models.Patient.findAll({
      where: { markedForSync: true },
      raw: true,
      attributes: ['id'],
    });
    return patients.map(({ id }) => id);
  }

  async getAdministeredVaccines(queryOptions = {}) {
    const { models } = this.sequelize;
    const certifiableVaccineIds = await models.CertifiableVaccine.allVaccineIds();

    const { where: optWhere = {}, include = [], ...optRest } = queryOptions;

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

    const results = await models.AdministeredVaccine.findAll({
      order: [['date', 'DESC']],
      ...optRest,
      include,
      where: {
        ...optWhere,
        '$encounter.patient_id$': this.id,
        status: 'GIVEN',
      },
    });

    const data = results.map(x => x.get({ plain: true }));

    for (const record of data) {
      if (certifiableVaccineIds.includes(record.scheduledVaccine.vaccineId)) {
        record.certifiable = true;
      }
    }

    return data;
  }

  async getCovidLabTests(queryOptions) {
    const labRequests = await this.sequelize.models.LabRequest.findAll({
      raw: true,
      nest: true,
      ...queryOptions,
      where: { status: LAB_REQUEST_STATUSES.PUBLISHED },
      include: [
        { association: 'requestedBy' },
        {
          association: 'category',
          where: { name: Sequelize.literal("UPPER(category.name) LIKE ('%COVID%')") },
        },
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
      ],
    });

    // Place the tests data at the top level of the object as this is a getter for lab tests
    // After the merge, id is the lab test id and labRequestId is the lab request id
    const labTests = labRequests.map(labRequest => {
      const { tests, ...labRequestData } = labRequest;
      return { ...labRequestData, ...tests };
    });

    return labTests.slice().sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }
}
