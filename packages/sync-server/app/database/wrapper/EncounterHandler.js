import { BasicHandler, findSinceQuery, countSinceQuery, insertQuery } from './BasicHandler';

export class EncounterHandler extends BasicHandler {
  models = null;

  constructor(models) {
    super(models.Encounter);
    this.models = models;
  }

  async insert(record, { patientId, ...params }) {
    const [baseValues, baseOptions] = insertQuery({ ...record, patientId }, params);
    return this.models.Encounter.upsert(baseValues, baseOptions);
  }

  async countSince({ patientId, ...params }) {
    const query = this.addIncludesToQuery(countSinceQuery(params), patientId);
    return this.models.Encounter.count(query);
  }

  async findSince({ patientId, ...params }) {
    const query = this.addIncludesToQuery(findSinceQuery(params), patientId);
    const records = await this.models.Encounter.findAll(query);
    return records.map(result => {
      const plain = result.get({ plain: true });
      delete plain.patient; // manually remove associated record
      return plain;
    });
  }

  addIncludesToQuery(baseQuery, patientId) {
    return {
      ...baseQuery,
      include: [
        ...(baseQuery.include || []),
        {
          model: this.models.Patient,
          where: { id: patientId },
          as: 'patient',
          paranoid: false,
        },
      ],
    };
  }
}
