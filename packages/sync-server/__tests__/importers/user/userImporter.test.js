import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/shared/test-helpers/fake';

import { importerTransaction } from '../../../app/admin/importerEndpoint';
import { referenceDataImporter } from '../../../app/admin/referenceDataImporter';
import { createTestContext } from '../../utilities';
import '../matchers';

// the importer can take a little while
jest.setTimeout(30000);

describe('User import', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  function doImport(options) {
    const { file, ...opts } = options;
    return importerTransaction({
      importer: referenceDataImporter,
      file: `./__tests__/importers/user/${file}.xlsx`,
      models,
      includedDataTypes: ['user'],
      ...opts,
    });
  }

  describe('Visibility Status Import', () => {
    it('succeeds with valid current visibility status', async () => {
      const { didntSendReason, errors, stats } = await doImport({
        file: 'user-current-visibility-status',
        dryRun: true,
      });

      expect(didntSendReason).toEqual('dryRun');
      expect(errors).toBeEmpty();
      expect(stats).toEqual({
        User: { created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 },
      });
    });

    it('succeeds with valid historical visibility status', async () => {
      const { didntSendReason, errors, stats } = await doImport({
        file: 'user-historical-visibility-status',
        dryRun: true,
      });

      expect(didntSendReason).toEqual('dryRun');
      expect(errors).toBeEmpty();
      expect(stats).toEqual({
        User: { created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 },
      });
    });

    it('succeeds with update an existing current user with valid historical visibility status', async () => {
      const { id: userId } = await models.User.create({
        ...fake(models.User),
        id: 'users-test',
        email: 'test@bes.au',
        displayName: 'Test Test',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const { errors, stats } = await doImport({
        file: 'user-historical-visibility-status',
        dryRun: false,
      });

      expect(errors).toBeEmpty();
      expect(stats).toEqual({
        User: { created: 0, updated: 1, errored: 0, deleted: 0, restored: 0, skipped: 0 },
      });

      const updatedUser = await models.User.findByPk(userId);
      expect(updatedUser.visibilityStatus).toEqual(VISIBILITY_STATUSES.HISTORICAL);
    });

    it('not succeed with invalid merged visibility status', async () => {
      const { didntSendReason, errors } = await doImport({
        file: 'user-invalid-visibility-status',
        dryRun: true,
      });

      expect(didntSendReason).toEqual('validationFailed');
      expect(errors).toContainValidationError(
        'user',
        2,
        'visibilityStatus must be one of the following values: current, historical',
      );
    });
  });
});
