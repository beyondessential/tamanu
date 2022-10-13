import { importerTransaction } from '../../app/admin/importerEndpoint';
import { importer } from '../../app/admin/programImporter';
import { createTestContext } from '../utilities';

// the importer can take a little while
jest.setTimeout(30000);

describe('Programs import', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(async () => {
    await ctx.close();
  });

  function doImport(options) {
    const { file, ...opts } = options;
    return importerTransaction({
      importer,
      file: `./__tests__/importers/programs/${file}.xlsx`,
      models: ctx.store.models,
      ...opts,
    });
  }

  it('should succeed with valid data', async () => {
    const { didntSendReason, errors, stats } = await doImport({ file: 'valid', dryRun: true });

    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toBeEmpty();
    expect(stats).toEqual({
      Program: { created: 1, updated: 0, errored: 0 },
      Survey: { created: 1, updated: 0, errored: 0 },
      ProgramDataElement: { created: 21, updated: 0, errored: 0 },
      SurveyScreenComponent: { created: 21, updated: 0, errored: 0 },
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
      `ENOENT: no such file or directory, open './__tests__/importers/programs/nofile.xlsx'`,
    );
  });

  describe('Config validation', () => {

    it('should fail on an invalid validation', async () => {
      const { errors, stats } = await doImport({
        file: 'config',
        dryRun: true,
      });

      errors.forEach(e => {
        console.log('E', e.message, e.rowNumber);
      })
    });

  });
});
