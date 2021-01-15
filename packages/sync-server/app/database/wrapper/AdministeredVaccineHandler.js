import { BasicHandler, findSinceQuery, countSinceQuery, insertQuery } from './BasicHandler';

export class AdministeredVaccineHandler extends BasicHandler {
  models = null;

  constructor(models) {
    super(models.AdministeredVaccine);
    this.models = models;
  }

  async insert(record, { patientId, ...params }) {
    const { encounterId } = record;
    const encounter = await this.models.Encounter.findOne({
      where: { id: encounterId, patientId },
    });

    // TODO: add test for this
    if (!encounter) {
      throw new Error(
        `Couldn't find an encounter with id "${encounterId}" for patient "${patientId}"`,
      );
    }

    const [baseValues, baseOptions] = insertQuery(record, params);
    return this.models.AdministeredVaccine.upsert(baseValues, baseOptions);
  }

  async countSince({ patientId, ...params }) {
    const query = this.addIncludesToQuery(countSinceQuery(params), patientId);
    return this.models.AdministeredVaccine.count(query);
  }

  async findSince({ patientId, ...params }) {
    const query = this.addIncludesToQuery(findSinceQuery(params), patientId);
    const records = await this.models.AdministeredVaccine.findAll(query);
    return records.map(result => {
      const plain = result.get({ plain: true });
      delete plain.encounter; // manually remove associated record
      return plain;
    });
  }

  addIncludesToQuery(baseQuery, patientId) {
    return {
      ...baseQuery,
      include: [
        ...(baseQuery.include || []),
        {
          model: this.models.Encounter,
          as: 'encounter',
          paranoid: false,
          required: true,
          include: [
            {
              model: this.models.Patient,
              where: { id: patientId },
              as: 'patient',
              paranoid: false,
            },
          ],
        },
      ],
    };
  }
}
