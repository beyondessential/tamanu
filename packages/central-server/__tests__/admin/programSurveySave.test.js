import { VISIBILITY_STATUSES } from '@tamanu/constants';

import { createTestContext } from '../utilities';

jest.setTimeout(120 * 1000);

// Saving an edited program through the AI form builder supersedes the previous
// survey version (old → historical, new → current) instead of leaving two
// active near-duplicate surveys; unchanged surveys are left untouched.
describe('AI form builder survey save', () => {
  let ctx;
  let app;
  let models;

  // Distinct survey codes per test so the globally-scoped getAvailableSurveyCode
  // doesn't suffix one test's survey because of another's.
  const buildForm = (surveyCode, questionText) => ({
    title: 'NCD Save Test',
    programCode: 'savetest',
    programName: 'NCD Save Test',
    surveys: [{ code: surveyCode, name: 'Referral', surveyType: 'programs' }],
    surveySheets: [
      {
        surveyName: 'Referral',
        questions: [
          { code: `${surveyCode}001`, name: 'Reason', text: questionText, type: 'FreeText' },
        ],
      },
    ],
  });

  const save = (programId, form) =>
    app.post(`/v1/admin/program/${encodeURIComponent(programId)}/ai-form-builder-survey`).send({ form });

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    app = await ctx.baseApp.asNewRole([
      ['read', 'Program'],
      ['create', 'Survey'],
      ['write', 'Survey'],
    ]);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('supersedes the previous survey version when content changes', async () => {
    const program = await models.Program.create({ id: 'program-savetest', name: 'NCD Save Test' });

    const first = await save(program.id, buildForm('supref', 'Reason for referral'));
    expect(first).toHaveSucceeded();
    const firstSurveyId = first.body.surveys[0].id;

    const second = await save(program.id, buildForm('supref', 'Updated reason for referral'));
    expect(second).toHaveSucceeded();
    const secondSurveyId = second.body.surveys[0].id;

    expect(secondSurveyId).not.toBe(firstSurveyId);
    expect((await models.Survey.findByPk(firstSurveyId)).visibilityStatus).toBe(
      VISIBILITY_STATUSES.HISTORICAL,
    );
    expect((await models.Survey.findByPk(secondSurveyId)).visibilityStatus).toBe(
      VISIBILITY_STATUSES.CURRENT,
    );

    const current = await models.Survey.findAll({
      where: { programId: program.id, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
    });
    expect(current).toHaveLength(1);
  });

  it('does not create a new version when the survey is unchanged', async () => {
    const program = await models.Program.create({
      id: 'program-savetest-2',
      name: 'NCD Save Test 2',
    });

    const first = await save(program.id, buildForm('unchref', 'Reason for referral'));
    expect(first).toHaveSucceeded();
    const firstSurveyId = first.body.surveys[0].id;

    const second = await save(program.id, buildForm('unchref', 'Reason for referral'));
    expect(second).toHaveSucceeded();

    expect(second.body.surveys[0].id).toBe(firstSurveyId);
    expect((await models.Survey.findByPk(firstSurveyId)).visibilityStatus).toBe(
      VISIBILITY_STATUSES.CURRENT,
    );
    const allForProgram = await models.Survey.findAll({ where: { programId: program.id } });
    expect(allForProgram).toHaveLength(1);
  });
});
