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
    const baseQuery = countSinceQuery(params);
    const query = {
      ...baseQuery,
      where: {
        ...baseQuery.where,
        patientId,
      },
    };
    return this.models.Encounter.count(query);
  }

  async findSince({ patientId, ...params }) {
    const baseQuery = findSinceQuery(params);
    const query = {
      ...baseQuery,
      where: {
        ...baseQuery.where,
        patientId,
      },
      include: [
        ...(baseQuery.include || []),
        {
          model: this.models.AdministeredVaccine,
          as: 'administeredVaccines',
        },
        {
          model: this.models.SurveyResponse,
          as: 'surveyResponses',
          include: [
            {
              model: this.models.SurveyResponseAnswer,
              as: 'surveyResponseAnswers',
            },
          ],
        },
      ],
    };
    const records = await this.models.Encounter.findAll(query);
    return records.map(result => result.get({ plain: true }));
  }
}
