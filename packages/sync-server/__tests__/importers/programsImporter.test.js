import { fake } from 'shared/test-helpers/fake';
import { SURVEY_TYPES } from 'shared/constants';
import { importerTransaction } from '../../app/admin/importerEndpoint';
import { importer } from '../../app/admin/programImporter';
import { createTestContext } from '../utilities';
import './matchers';

// the importer can take a little while
jest.setTimeout(30000);

describe('Programs import', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  beforeEach(async () => {
    const { Program, Survey, ProgramDataElement, SurveyScreenComponent } = ctx.store.models;
    await SurveyScreenComponent.destroy({ where: {}, force: true });
    await ProgramDataElement.destroy({ where: {}, force: true });
    await Survey.destroy({ where: {}, force: true });
    await Program.destroy({ where: {}, force: true });
  });
  afterAll(async () => {
    await ctx.close();
  });

  function doImport(options) {
    const { file, ...opts } = options;
    return importerTransaction({
      importer,
      file: `./__tests__/importers/programs-${file}.xlsx`,
      models: ctx.store.models,
      ...opts,
    });
  }

  it('should succeed with valid data', async () => {
    const { didntSendReason, errors, stats } = await doImport({ file: 'valid', dryRun: true });

    expect(errors).toBeEmpty();
    expect(didntSendReason).toEqual('dryRun');
    expect(stats).toEqual({
      Program: { created: 1, updated: 0, errored: 0 },
      Survey: { created: 1, updated: 0, errored: 0 },
      ProgramDataElement: { created: 21, updated: 0, errored: 0 },
      SurveyScreenComponent: { created: 21, updated: 0, errored: 0 },
    });
  });

  it('should ignore obsolete surveys worksheets', async () => {
    const { didntSendReason, errors, stats } = await doImport({ file: 'obsolete', dryRun: true });

    expect(errors).toBeEmpty();
    expect(didntSendReason).toEqual('dryRun');
    expect(stats).toEqual({
      Program: { created: 1, updated: 0, errored: 0 },
      Survey: { created: 1, updated: 0, errored: 0 },
    });
  });

  it('should properly update surveys as obsolete', async () => {
    await doImport({ file: 'valid', dryRun: false });
    const { didntSendReason, errors, stats } = await doImport({ file: 'obsolete', dryRun: true });

    expect(errors).toBeEmpty();
    expect(didntSendReason).toEqual('dryRun');
    expect(stats).toEqual({
      Program: { created: 0, updated: 1, errored: 0 },
      Survey: { created: 0, updated: 1, errored: 0 },
    });
  });

  it('should not write anything for a dry run', async () => {
    const { ProgramDataElement } = ctx.store.models;
    const beforeCount = await ProgramDataElement.count();

    await doImport({ file: 'valid', dryRun: true });

    const afterCount = await ProgramDataElement.count();
    expect(afterCount).toEqual(beforeCount);
  });

  it('should error on missing file', async () => {
    const { didntSendReason, errors } = await doImport({
      file: 'nofile',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');

    expect(errors[0]).toHaveProperty(
      'message',
      `ENOENT: no such file or directory, open './__tests__/importers/programs-nofile.xlsx'`,
    );
  });

  it('run validation against question configs', async () => {
    const { didntSendReason, errors, stats } = await doImport({
      file: 'question-validation',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');
    expect(errors.length).toEqual(31);
    expect(stats).toEqual({
      Program: { created: 1, updated: 0, errored: 0 },
      Survey: { created: 2, updated: 0, errored: 0 },
      ProgramDataElement: { created: 40, updated: 0, errored: 0 },
      SurveyScreenComponent: { created: 9, updated: 0, errored: 31 }, // 31 fields in failure test, 9 in success test
    });
  });

  describe('Vitals survey', () => {
    it('Should detect if the mandatory vitals questions are missing', async () => {
      const { errors } = await doImport({
        file: 'vitals-missing-qs',
        dryRun: true,
      });
      expect(errors).toContainValidationError('Vitals', 0, 'Survey missing required questions');
    });

    it('Should refuse to import more than one vitals survey', async () => {
      const { Program, Survey } = ctx.store.models;
      const program = await Program.create(fake(Program));
      await Survey.create({
        ...fake(Survey),
        surveyType: SURVEY_TYPES.VITALS,
        programId: program.id,
      });

      const { errors } = await doImport({
        file: 'vitals-valid',
        dryRun: true,
      });
      expect(errors).toContainValidationError('metadata', 0, 'Only one vitals survey');
    });

    it('Should import a valid vitals survey', async () => {
      const { errors, stats, didntSendReason } = await doImport({
        file: 'vitals-valid',
        dryRun: true,
      });
      expect(errors).toBeEmpty();
      expect(didntSendReason).toEqual('dryRun');
      expect(stats).toEqual({
        Program: { created: 1, updated: 0, errored: 0 },
        Survey: { created: 1, updated: 0, errored: 0 },
        ProgramDataElement: { created: 16, updated: 0, errored: 0 },
        SurveyScreenComponent: { created: 16, updated: 0, errored: 0 },
      });
    });
  });
});
