import { REFERENCE_TYPES } from '@tamanu/constants';

import { importerTransaction } from '../../../dist/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../../dist/admin/referenceDataImporter';
import { createTestContext } from '../../utilities';
import '../matchers';

// the importer can take a little while
jest.setTimeout(30000);

describe('Lab Test Panel import', () => {
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
      file: `./__tests__/importers/labTestPanel/${file}.xlsx`,
      models,
      includedDataTypes: ['labTestPanel'],
      checkPermission: () => true,
      ...opts,
    });
  }

  describe('Valid data', () => {
    it('should succeed with valid data', async () => {
      const { didntSendReason, errors, stats } = await doImport({
        file: 'lab-test-panel-valid',
        dryRun: true,
      });

      expect(didntSendReason).toEqual('dryRun');
      expect(errors).toBeEmpty();
      expect(stats).toEqual({
        LabTestPanel: { created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 },
        LabTestPanelLabTestTypes: {
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
    it('should validate LabTestPanel mandatory categoryId field', async () => {
      const { didntSendReason, errors } = await doImport({
        file: 'lab-test-panel-no-category-id',
        dryRun: true,
      });

      expect(didntSendReason).toEqual('validationFailed');

      expect(errors).toContainValidationError(
        'labTestPanel',
        2,
        'categoryId is a required field on labTestPanel at row 2',
      );
    });
  });
});
