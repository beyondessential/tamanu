import { createTestContext } from '../../utilities';
import { importerTransaction } from '../../../app/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../../app/admin/referenceDataImporter';
import { DEFAULT_LANGUAGE_CODE } from '@tamanu/constants';

describe('Translated String import', () => {
  let ctx;
  let models;
  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });
  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.TranslatedString.destroy({ where: {}, force: true });
  });

  function doImport(options) {
    const { file, ...opts } = options;
    return importerTransaction({
      importer: referenceDataImporter,
      file: `./__tests__/importers/translatedString/${file}.xlsx`,
      models,
      includedDataTypes: ['translatedString'],
      checkPermission: () => true,
      ...opts,
    });
  }

  describe('Valid data', () => {
    it('should produce 4 records from two columns with two languages', async () => {
      const { didntSendReason, errors, stats } = await doImport({
        file: 'translated-string-valid',
        dryRun: true,
      });

      expect(didntSendReason).toEqual('dryRun');
      expect(errors).toBeEmpty();
      expect(stats).toEqual({
        TranslatedString: {
          created: 4,
          updated: 0,
          errored: 0,
          deleted: 0,
          restored: 0,
          skipped: 0,
        },
      });
    });
    it('should produce 2 records from two columns with two languages but only one filled out', async () => {
      const { didntSendReason, errors, stats } = await doImport({
        file: 'translated-string-single-language-missing',
        dryRun: true,
      });

      expect(didntSendReason).toEqual('dryRun');
      expect(errors).toBeEmpty();
      expect(stats).toEqual({
        TranslatedString: {
          created: 2,
          updated: 0,
          errored: 0,
          deleted: 0,
          restored: 0,
          skipped: 0,
        },
      });
    });
  });

  it('should not overwrite if skipExisting is true', async () => {
    const { TranslatedString } = models;
    await TranslatedString.create({
      stringId: 'test.string.1',
      language: 'en',
      text: 'original value',
    });

    // excel file includes an update to test.string.1, and a new string test.string.2
    const { errors, stats } = await doImport({
      file: 'translated-string-skip-existing',
      skipExisting: true,
    });
    expect(errors).toBeEmpty();
    expect(stats).toMatchObject({
      TranslatedString: {
        created: 1,
        skipped: 1,
      },
    });
    const updatedString = await TranslatedString.findOne({
      where: { stringId: 'test.string.1', language: 'en' },
    });
    expect(updatedString.text).toEqual('original value');
  });

  it('should overwrite if skipExisting is not provided', async () => {
    const { TranslatedString } = models;
    await TranslatedString.create({
      stringId: 'test.string.1',
      language: 'en',
      text: 'original value',
    });

    // excel file includes an update to test.string.1, and a new string test.string.2
    const { errors, stats } = await doImport({
      file: 'translated-string-skip-existing',
    });
    expect(errors).toBeEmpty();
    expect(stats).toMatchObject({
      TranslatedString: {
        created: 1,
        updated: 1,
      },
    });
    const updatedString = await TranslatedString.findOne({
      where: { stringId: 'test.string.1', language: 'en' },
    });
    expect(updatedString.text).toEqual('new value');
  });

  it('should delete existing translations if the cell is empty', async () => {
    const { TranslatedString } = models;
    await TranslatedString.create({
      stringId: 'test.string.1',
      language: 'en',
      text: 'original value',
    });

    // excel file includes an update to test.string.1, and a new string test.string.2
    const { errors: errors1, stats: stats1 } = await doImport({
      file: 'translated-string-valid',
    });
    expect(errors1).toBeEmpty();
    expect(stats1).toMatchObject({
      TranslatedString: {
        created: 4,
        updated: 0,
        errored: 0,
        deleted: 0,
        restored: 0,
        skipped: 0,
      },
    });

    const { errors: errors2, stats: stats2 } = await doImport({
      file: 'translated-string-single-language-missing',
    });
    expect(errors2).toBeEmpty();
    expect(stats2).toMatchObject({
      TranslatedString: {
        created: 0,
        updated: 2,
        errored: 0,
        deleted: 2,
        restored: 0,
        skipped: 2,
      },
    });
    const deletedStrings = await TranslatedString.findAll({
      where: { language: 'km' },
    });
    expect(deletedStrings.length).toEqual(0);

    // Should restore deleted translations
    const { errors: errors3, stats: stats3 } = await doImport({
      file: 'translated-string-valid',
    });
    expect(errors3).toBeEmpty();
    expect(stats3).toMatchObject({
      TranslatedString: {
        created: 0,
        updated: 2,
        errored: 0,
        deleted: 0,
        restored: 2,
        skipped: 2,
      },
    });
    const restoredStrings = await TranslatedString.findAll({
      where: { language: 'km' },
    });
    expect(restoredStrings.length).toEqual(2);
  });

  it('should ignore default translations', async () => {
    const { TranslatedString } = models;
    await TranslatedString.create({
      stringId: 'login.email',
      language: DEFAULT_LANGUAGE_CODE,
      text: 'Default email',
    });
    await TranslatedString.create({
      stringId: 'login.password',
      language: DEFAULT_LANGUAGE_CODE,
      text: 'Default password',
    });

    const { errors, stats } = await doImport({
      file: 'translated-string-with-default',
    });

    expect(errors).toBeEmpty();
    expect(stats).toEqual({
      TranslatedString: {
        created: 4, // 6 in the file, but default should be ignored
        updated: 0,
        errored: 0,
        deleted: 0,
        restored: 0,
        skipped: 0,
      },
    });

    const strings = await TranslatedString.findAll({
      where: {
        language: DEFAULT_LANGUAGE_CODE,
      },
    });
    expect(strings.length).toEqual(2);
    expect(strings.find(s => s.stringId === 'login.email').text).toEqual('Default email');
    expect(strings.find(s => s.stringId === 'login.password').text).toEqual('Default password');
  });
});
