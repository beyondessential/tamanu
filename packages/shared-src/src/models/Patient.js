import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, LAB_REQUEST_STATUSES } from 'shared/constants';
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

  async getAdministeredVaccines(queryOptions) {
    const { models } = this.sequelize;
    return models.AdministeredVaccine.findAll({
      raw: true,
      nest: true,
      ...queryOptions,
      where: {
        '$encounter.patient_id$': this.id,
        status: 'GIVEN',
      },
      order: [['date', 'DESC']],
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

  async getCovidLabTests(queryOptions) {
    return this.sequelize.models.LabRequest.findAll({
      raw: true,
      nest: true,
      ...queryOptions,
      where: { status: LAB_REQUEST_STATUSES.PUBLISHED },
      include: [
        { association: 'requestedBy' },
        {
          association: 'category',
          where: {
            name: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('name')), 'LIKE', '%covid%'),
          },
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
  }
}
