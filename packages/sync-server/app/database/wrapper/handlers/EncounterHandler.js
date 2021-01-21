import {
  BasicHandler,
  findSinceQuery,
  countSinceQuery,
  upsertQuery,
  markDeletedQuery,
} from './BasicHandler';

function extractRelated(record, relation, { fk = 'encounterId' } = {}) {
  return record[relation].map(relatedRecord => ({
    ...relatedRecord,
    [fk]: record.id,
  }));
}

const MARK_ANSWERS_DELETED_SQL = `UPDATE survey_response_answers AS sra
SET updated_at = CURRENT_TIMESTAMP, deleted_at = CURRENT_TIMESTAMP
FROM survey_responses AS sr
WHERE sra.response_id = sr.id AND sr.encounter_id = :encounterId`;

export class EncounterHandler extends BasicHandler {
  models = null;

  sequelize = null;

  constructor(models, sequelize) {
    super(models.Encounter);
    this.models = models;
    this.sequelize = sequelize;
  }

  async upsert(rawEncounter, { patientId, ...params }) {
    // related records which aren't present will NOT be deleted
    const encounter = { ...rawEncounter, patientId };

    return this.sequelize.transaction(async transaction => {
      const upsert = (model, records) =>
        Promise.all(
          records.map(record => {
            const [baseRecord, baseOptions] = upsertQuery(record, params);
            return model.upsert(baseRecord, { ...baseOptions, transaction });
          }),
        );

      await upsert(this.models.Encounter, [encounter]);

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

      return 1;
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
        ...(baseQuery.where || {}),
        patientId,
      },
      include: [
        ...(baseQuery.include || []),
        {
          model: this.models.AdministeredVaccine,
          as: 'administeredVaccines',
          paranoid: false,
        },
        {
          model: this.models.SurveyResponse,
          as: 'surveyResponses',
          paranoid: false,
          include: [
            {
              model: this.models.SurveyResponseAnswer,
              as: 'answers',
              paranoid: false,
            },
          ],
        },
      ],
    };
    const records = await this.models.Encounter.findAll(query);
    return records.map(result => result.get({ plain: true }));
  }

  async markRecordDeleted(id) {
    const [baseValues, baseQuery] = markDeletedQuery({ id });
    let count;
    await this.sequelize.transaction(async transaction => {
      const encounterPromise = this.model.update(baseValues, {
        ...baseQuery,
        transaction,
      });

      await Promise.all([
        encounterPromise,
        this.models.AdministeredVaccine.update(baseValues, {
          ...baseQuery,
          where: { encounterId: id },
          transaction,
        }),
        this.models.SurveyResponse.update(baseValues, {
          ...baseQuery,
          where: { encounterId: id },
          transaction,
        }),
        this.sequelize.query(MARK_ANSWERS_DELETED_SQL, {
          replacements: { encounterId: id },
        }),
      ]);

      [count] = await encounterPromise;
    });
    return count;
  }
}
