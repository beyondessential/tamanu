import { createTestContext } from "../../utilities";
import { importerTransaction } from "../../../app/admin/importerEndpoint";
import { referenceDataImporter } from "../../../app/admin/referenceDataImporter";

describe('Translated String import', () => {
    let ctx;
    let models;
    beforeAll(async () => {
        ctx = await createTestContext();
        models = ctx.store.models;
    })
    afterAll(() => ctx.close());

    function doImport(options) {
        const { file, ...opts } = options;
        return importerTransaction({
          importer: referenceDataImporter,
          file: `./__tests__/importers/translatedString/${file}.xlsx`,
          models,
          includedDataTypes: ['translatedString'],
          ...opts,
        });
      }

      describe('Valid data', () => {
        it('should produce 4 records from two columns with two languages', async () => {
          const { didntSendReason, errors,stats } = await doImport({
            file: 'translated-string-valid',
            dryRun: true,
          });
    
          expect(didntSendReason).toEqual('dryRun');
          expect(errors).toBeEmpty();
          expect(stats).toEqual({
            TranslatedString: { created: 4, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 },
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
              TranslatedString: { created: 2, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 },
            });
          });
    });
})