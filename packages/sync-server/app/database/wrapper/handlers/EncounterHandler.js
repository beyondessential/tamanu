import { BasicHandler, findSinceQuery, countSinceQuery, upsertQuery } from './BasicHandler';

function extractRelated(record, relation, { fk = 'encounterId' } = {}) {
  return record[relation].map(relatedRecord => ({
    ...relatedRecord,
    [fk]: record.id,
  }));
}

export class EncounterHandler extends BasicHandler {
  models = null;

  sequelize = null;

  constructor(models, sequelize) {
    super(models.Encounter);
    this.models = models;
    this.sequelize = sequelize;
  }

  async insert(rawEncounter, { patientId, ...params }) {
    const encounter = { ...rawEncounter, patientId };

    return this.sequelize.transaction(async transaction => {
      const upsert = (model, records) =>
        Promise.all(
          records.map(record => {
            const [baseRecord, baseOptions] = upsertQuery(record, params);
            return model.upsert(baseRecord, { ...baseOptions, transaction });
          }),
        );

      const count = await upsert(this.models.Encounter, [encounter]);

      await upsert(
        this.models.AdministeredVaccine,
        extractRelated(encounter, 'administeredVaccines'),
      );

      const surveyResponses = extractRelated(encounter, 'surveyResponses');
      await upsert(this.models.SurveyResponse, surveyResponses);

      const surveyResponseAnswers = surveyResponses
        .map(r => extractRelated(r, 'answers', { fk: 'responseId' }))
        .flat();
      await upsert(this.models.SurveyResponseAnswer, surveyResponseAnswers);

      return count;
    });
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
              as: 'answers',
            },
          ],
        },
      ],
    };
    const records = await this.models.Encounter.findAll(query);
    return records.map(result => result.get({ plain: true }));
  }
}
