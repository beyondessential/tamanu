import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
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

  async getAdministeredVaccines() {
    const { models } = this.sequelize;
    return models.AdministeredVaccine.findAll({
      where: {
        ['$encounter.patient_id$']: this.id,
        status: 'GIVEN',
      },
      include: [
        {
          model: models.Encounter,
          as: 'encounter',
          include: models.Encounter.getFullReferenceAssociations(),
        },
        {
          model: models.ScheduledVaccine,
          as: 'scheduledVaccine',
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

  /*
   * Generates a 12 digit hash made up of a uuidv4 and a date
   * - First 6 digits are the first 7 digits of the uuid in base 36
   * - Second 6 digits are the timestamp converted to seconds since epoch in base 36
   *
   * Probabilities of collision estimates (based on 1 - math.exp(-0.5 * k * (k - 1) / N))
   * N = 2^28 based on 7 x hex values = 28 bits of data. This assumption is based on the first
   * 7 values of the uuid being random which they are in uuid v4 (but not in v1)
   *
   * For k,the probability of collision is 1 in p
   * k=2    p=268,435,000
   * k=10   p=5,965,000
   * k=100  p=54,000
   * k=1000 p=1,000
   *
   * eg. If 2 patients get a latest vaccine updatedAt the same time to the second then
   * there is a 1 in 268 million chance of collision
   */
  generateUUIDDateHash(uuid, date) {
    // uuid hash - 7 x hex values = 28 bits of data
    const segment = uuid.slice(0, 7);
    const number = parseInt(segment, 16);
    const uuidHash = number.toString(36);
    console.log('uuidHash: ', uuidHash);

    // time hash
    const time = date.getTime();
    const updatedAtSeconds = (time / 1000).toFixed();
    const timeHash = Number(updatedAtSeconds).toString(36);
    console.log('timeHash: ', timeHash);

    let hash = `${uuidHash}${timeHash}`;

    // add zeros at the start to pad to 12 characters
    if (hash.length < 12) {
      console.log('pad', hash.length);
      hash = `0${hash}`;
    }

    console.log('Full Hash: ', hash, hash.length);
    return hash;
  }

  async getIcauUVCI() {
    const { models } = this.sequelize;

    const vaccinations = await models.AdministeredVaccine.findAll({
      where: {
        ['$encounter.patient_id$']: this.id,
        status: 'GIVEN',
      },
      include: [
        {
          model: models.Encounter,
          as: 'encounter',
          include: models.Encounter.getFullReferenceAssociations(),
        },
        {
          model: models.ScheduledVaccine,
          as: 'scheduledVaccine',
        },
      ],
    });

    // Todo: Get newest
    const record = vaccinations[0];
    const id = record.get('id');
    const updatedAt = record.get('updatedAt');

    const uvci = this.generateUUIDDateHash(id, updatedAt);
    return uvci;
  }
}
