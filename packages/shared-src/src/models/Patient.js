import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';
import { generateUUIDDateTimeHash } from '../utils';

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
        dateOfDeath: Sequelize.DATE,
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
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
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

    // technically this relation is hasOne but this just describes
    // "there is another table referencing this one by id"
    this.hasMany(models.PatientAdditionalData, {
      foreignKey: 'patientId',
      as: 'additionalData',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'villageId',
      as: 'village',
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

  async getAdministeredVaccines() {
    const { models } = this.sequelize;
    return models.AdministeredVaccine.findAll({
      where: {
        ['$encounter.patient_id$']: this.id,
        status: 'GIVEN',
      },
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: models.Encounter,
          as: 'encounter',
          include: models.Encounter.getFullReferenceAssociations(),
        },
        {
          model: models.ScheduledVaccine,
          as: 'scheduledVaccine',
          include: models.ScheduledVaccine.getListReferenceAssociations(),
        },
      ],
    });
  }

  async getLabRequests(queryOptions) {
    return this.sequelize.models.LabRequest.findAll({
      raw: true,
      nest: true,
      ...queryOptions,
      include: [
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
      ],
    });
  }

  async getIcaoUVCI() {
    const { models } = this.sequelize;

    const vaccinations = await models.AdministeredVaccine.findAll({
      where: {
        ['$encounter.patient_id$']: this.id,
        status: 'GIVEN',
      },
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: models.Encounter,
          as: 'encounter',
          include: models.Encounter.getFullReferenceAssociations(),
        },
      ],
    });

    const latestVaccination = vaccinations[0];
    const patientId = this.id;
    const updatedAt = latestVaccination.get('updatedAt');

    return generateUUIDDateTimeHash(patientId, updatedAt);
  }
}
