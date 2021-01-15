import { BasicHandler, findSinceQuery, countSinceQuery, insertQuery } from './BasicHandler';

export class SurveyResponseAnswerHandler extends BasicHandler {
  models = null;

  constructor(models) {
    super(models.SurveyResponseAnswer);
    this.models = models;
  }

  async insert(record, { patientId, ...params }) {
    const { responseId } = record;
    const encounter = await this.models.SurveyResponse.findOne({
      where: { id: responseId },
      include: [
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
    });

    // TODO: add test for this
    if (!encounter) {
      throw new Error(
        `Couldn't find a survey response with id "${responseId}" for patient "${patientId}"`,
      );
    }

    const [baseValues, baseOptions] = insertQuery(record, params);
    return this.models.SurveyResponseAnswer.upsert(baseValues, baseOptions);
  }

  async countSince({ patientId, ...params }) {
    const query = this.addIncludesToQuery(countSinceQuery(params), patientId);
    return this.models.SurveyResponseAnswer.count(query);
  }

  async findSince({ patientId, ...params }) {
    const query = this.addIncludesToQuery(findSinceQuery(params), patientId);
    const records = await this.models.SurveyResponseAnswer.findAll(query);
    return records.map(result => {
      const plain = result.get({ plain: true });
      delete plain.surveyResponse; // manually remove associated record
      return plain;
    });
  }

  addIncludesToQuery(baseQuery, patientId) {
    return {
      ...baseQuery,
      include: [
        ...(baseQuery.include || []),
        {
          model: this.models.SurveyResponse,
          as: 'surveyResponse',
          paranoid: false,
          required: true,
          include: [
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
        },
      ],
    };
  }
}
