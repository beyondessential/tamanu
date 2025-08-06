import { createTestContext } from '../utilities';
import { makeRoleWithPermissions } from '../permissions';
import './matchers';

// the importer can take a little while
jest.setTimeout(60000);

describe('Programs import - Permissions', () => {
  let ctx;
  let app;
  let models;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
    models = ctx.store.models;
  });

  beforeEach(async () => {
    const {
      Program,
      Survey,
      ProgramDataElement,
      SurveyScreenComponent,
      Permission,
      Role,
    } = ctx.store.models;
    await SurveyScreenComponent.destroy({ where: {}, force: true });
    await ProgramDataElement.destroy({ where: {}, force: true });
    await Survey.destroy({ where: {}, force: true });
    await Program.destroy({ where: {}, force: true });
    await Permission.destroy({ where: {}, force: true });
    await Role.destroy({ where: {}, force: true });
  });
  afterAll(async () => {
    await ctx.close();
  });

  it('forbids import if having insufficient permission for programs and surveys', async () => {
    await makeRoleWithPermissions(models, 'practitioner', [
      { verb: 'write', noun: 'EncounterDiagnosis' },
    ]);

    const result = await app
      .post('/v1/admin/import/program')
      .attach(`./__tests__/importers/programs-valid.xlsx`)
      .field('includedDataTypes', 'program');

    const { didntSendReason, errors } = result.body;

    expect(didntSendReason).toEqual('validationFailed');
    expect(errors[0]).toHaveProperty(
      'message',
      `ForbiddenError: No permission to perform action "create" on "Program"`,
    );
  });

  it('allows import if having sufficient permission for programs and surveys', async () => {
    await makeRoleWithPermissions(models, 'practitioner', [
      { verb: 'write', noun: 'Program' },
      { verb: 'create', noun: 'Program' },
      { verb: 'write', noun: 'Survey' },
      { verb: 'create', noun: 'Survey' },
    ]);

    const result = await app
      .post('/v1/admin/import/program')
      .attach('file', './__tests__/importers/programs-valid.xlsx')
      .field('includedDataTypes', 'program');

    const { didntSendReason, errors } = result.body;

    expect(didntSendReason).toBeUndefined();
    expect(errors).toBeEmpty();
  });
});
