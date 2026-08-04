import { QueryTypes } from 'sequelize';

import { fake } from '@tamanu/fake-data/fake';

import { createTestContext } from '../utilities';
import { setupSurvey } from '../setupSurvey';

describe('Edit reason in changelog entries', () => {
  let ctx;
  let sequelize;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    sequelize = ctx.sequelize;
  });

  afterAll(() => ctx.close());

  const createAnswer = async () => {
    const { surveyResponse } = await setupSurvey({ models });
    const dataElement = await models.ProgramDataElement.create(
      fake(models.ProgramDataElement, { type: 'Number' }),
    );
    return models.SurveyResponseAnswer.create({
      dataElementId: dataElement.id,
      responseId: surveyResponse.id,
      body: '80',
    });
  };

  const entriesFor = recordId =>
    sequelize.query(
      `SELECT reason, record_data->>'body' AS body FROM logs.changes
       WHERE table_name = 'survey_response_answers' AND record_id = :recordId
       ORDER BY created_at`,
      { type: QueryTypes.SELECT, replacements: { recordId } },
    );

  it('records the reason on the edit entry', async () => {
    const answer = await createAnswer();
    await sequelize.transaction(() =>
      answer.updateWithReasonForChange('92', 'entered-in-error'),
    );

    const entries = await entriesFor(answer.id);
    const editEntry = entries.find(entry => entry.body === '92');
    expect(editEntry).toBeDefined();
    expect(editEntry.reason).toBe('entered-in-error');
  });

  it('leaves no reason on unrelated writes in later transactions', async () => {
    const answer = await createAnswer();
    await sequelize.transaction(() =>
      answer.updateWithReasonForChange('92', 'entered-in-error'),
    );
    await sequelize.transaction(() => answer.update({ body: '95' }));

    const entries = await entriesFor(answer.id);
    const plainEntry = entries.find(entry => entry.body === '95');
    expect(plainEntry.reason).toBeNull();
  });
});
