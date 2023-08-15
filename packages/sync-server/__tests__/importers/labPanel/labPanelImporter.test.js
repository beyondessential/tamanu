import { REFERENCE_TYPES } from 'shared/constants';

import { importerTransaction } from '../../../app/admin/importerEndpoint';
import { referenceDataImporter } from '../../../app/admin/referenceDataImporter';
import { createTestContext } from '../../utilities';
import '../matchers';

// the importer can take a little while
jest.setTimeout(30000);

describe('Lab Panel import', () => {
  let ctx;
  let models;
  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    const { id: labTestCategoryId } = await models.ReferenceData.create({
      id: 'labTestCategory-LFT',
      code: 'labTestCategory-LFT',
      name: 'labTestCategory-LFT',
      type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
      visibilityStatus: 'current',
    });
    await models.LabTestType.create({
      id: 'labTestType-ALP',
      code: 'labTestType-ALP',
      name: 'labTestType-ALP',
      labTestCategoryId,
      visibilityStatus: 'current',
    });
  });

  afterAll(() => ctx.close());

  function doImport(options) {
    const { file, ...opts } = options;
    return importerTransaction({
      importer: referenceDataImporter,
      file: `./__tests__/importers/labPanel/${file}.xlsx`,
      models,
      includedDataTypes: ['labPanel'],
      ...opts,
    });
  }

  describe('Valid data', () => {
    it('should succeed with valid data', async () => {
      const { didntSendReason, errors, stats } = await doImport({
        file: 'lab-panel-valid',
        dryRun: true,
      });

      expect(didntSendReason).toEqual('dryRun');
      expect(errors).toBeEmpty();
      expect(stats).toEqual({
        LabPanel: { created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 },
        LabPanelLabTestTypes: {
          created: 1,
          updated: 0,
          errored: 0,
          deleted: 0,
          restored: 0,
          skipped: 0,
        },
      });
    });
  });

  describe('Invalid data', () => {
    it('should validate LabPanel mandatory categoryId field', async () => {
      const { didntSendReason, errors } = await doImport({
        file: 'lab-panel-no-category-id',
        dryRun: true,
      });

      expect(didntSendReason).toEqual('validationFailed');

      expect(errors).toContainValidationError(
        'labPanel',
        2,
        'categoryId is a required field on labPanel at row 2',
      );
    });
  });
});
