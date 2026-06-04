import { VISIBILITY_STATUSES } from '@tamanu/constants';

import { createTestContext } from '../utilities';

jest.setTimeout(120 * 1000);

// Editing a program through the AI form builder updates the existing survey in
// place: modified questions keep their code (so responses stay linked), new
// questions are added, removed questions are retired (historical), and the
// survey id is unchanged. Unchanged surveys are left untouched.
describe('AI form builder survey save', () => {
  let ctx;
  let app;
  let models;

  const buildForm = (surveyCode, questions) => ({
    title: 'NCD Save Test',
    programCode: 'savetest',
    programName: 'NCD Save Test',
    surveys: [{ code: surveyCode, name: 'Referral', surveyType: 'programs' }],
    surveySheets: [
      {
        surveyName: 'Referral',
        questions: questions.map(({ code, text }) => ({
          code,
          name: code,
          text,
          type: 'FreeText',
        })),
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

  it('updates an existing survey in place, preserving identity and retiring removed questions', async () => {
    const program = await models.Program.create({ id: 'program-savetest', name: 'NCD Save Test' });

    const first = await save(
      program.id,
      buildForm('qlref', [
        { code: 'qlref001', text: 'Original question one' },
        { code: 'qlref002', text: 'Original question two' },
      ]),
    );
    expect(first).toHaveSucceeded();
    const surveyId = first.body.surveys[0].id;

    // Modify q1, remove q2, add q3.
    const second = await save(
      program.id,
      buildForm('qlref', [
        { code: 'qlref001', text: 'Updated question one' },
        { code: 'qlref003', text: 'New question three' },
      ]),
    );
    expect(second).toHaveSucceeded();

    // Same survey, still current — not a duplicate.
    expect(second.body.surveys[0].id).toBe(surveyId);
    expect((await models.Survey.findByPk(surveyId)).visibilityStatus).toBe(
      VISIBILITY_STATUSES.CURRENT,
    );
    expect(
      await models.Survey.count({
        where: { programId: program.id, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
      }),
    ).toBe(1);

    // Modified question kept its data element (same id), text updated.
    expect((await models.ProgramDataElement.findByPk('pde-qlref001')).defaultText).toBe(
      'Updated question one',
    );
    // Removed question's component is retired, not deleted.
    expect((await models.SurveyScreenComponent.findByPk(`${surveyId}-qlref002`)).visibilityStatus).toBe(
      VISIBILITY_STATUSES.HISTORICAL,
    );
    // Added question is present and current.
    expect((await models.SurveyScreenComponent.findByPk(`${surveyId}-qlref003`)).visibilityStatus).toBe(
      VISIBILITY_STATUSES.CURRENT,
    );
  });

  it('does not rewrite a survey when its content is unchanged', async () => {
    const program = await models.Program.create({
      id: 'program-savetest-2',
      name: 'NCD Save Test 2',
    });

    const first = await save(program.id, buildForm('unchref', [{ code: 'unchref001', text: 'Reason' }]));
    expect(first).toHaveSucceeded();
    const surveyId = first.body.surveys[0].id;
    const componentBefore = await models.SurveyScreenComponent.findByPk(`${surveyId}-unchref001`);

    const second = await save(program.id, buildForm('unchref', [{ code: 'unchref001', text: 'Reason' }]));
    expect(second).toHaveSucceeded();
    expect(second.body.surveys[0].id).toBe(surveyId);

    // Untouched: the component wasn't rewritten (same sync tick).
    const componentAfter = await models.SurveyScreenComponent.findByPk(`${surveyId}-unchref001`);
    expect(componentAfter.updatedAtSyncTick).toBe(componentBefore.updatedAtSyncTick);
    expect(await models.Survey.count({ where: { programId: program.id } })).toBe(1);
  });
});
