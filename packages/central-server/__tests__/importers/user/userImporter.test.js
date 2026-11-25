import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';

import { importerTransaction } from '../../../app/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../../app/admin/referenceDataImporter';
import { createTestContext } from '../../utilities';
import '../matchers';

// the importer can take a little while
vi.setConfig({ testTimeout: 50000 });

const TEST_USER_ID = 'users-test';

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
      checkPermission: () => true,
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
      expect(errors).toHaveLength(0);
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
      expect(errors).toHaveLength(0);
      expect(stats).toEqual({
        User: { created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 },
      });
    });

    it('succeeds with update an existing current user with valid historical visibility status', async () => {
      const { id: userId } = await models.User.create({
        ...fake(models.User),
        id: TEST_USER_ID,
        email: 'test@bes.au',
        displayName: 'Test Test',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const { errors, stats } = await doImport({
        file: 'user-historical-visibility-status',
        dryRun: false,
      });

      expect(errors).toHaveLength(0);
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

  describe('Device Registration Quota Import', () => {
    beforeEach(async () => {
      await models.User.destroy({ where: { id: TEST_USER_ID }, force: true });
    });

    it('succeeds creating a new user with valid device registration quota', async () => {
      const { errors, stats } = await doImport({
        file: 'user-device-registration-quota-create',
        dryRun: false,
      });

      expect(errors).toHaveLength(0);
      expect(stats).toEqual({
        User: { created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 },
      });

      const user = await models.User.findByPk(TEST_USER_ID);
      expect(user.deviceRegistrationQuota).toEqual(1);
    });

    it('succeeds updating an existing user with valid device registration quota', async () => {
      await models.User.create({
        ...fake(models.User),
        id: TEST_USER_ID,
        email: 'test@bes.au',
        displayName: 'Test Test',
        deviceRegistrationQuota: 0,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const user = await models.User.findByPk(TEST_USER_ID);
      expect(user.deviceRegistrationQuota).toEqual(0);

      const { errors, stats } = await doImport({
        file: 'user-device-registration-quota-update',
        dryRun: false,
      });

      expect(errors).toHaveLength(0);
      expect(stats).toEqual({
        User: { created: 0, updated: 1, errored: 0, deleted: 0, restored: 0, skipped: 0 },
      });

      await user.reload();
      expect(user.deviceRegistrationQuota).toEqual(2);
    });
  });

  describe('Case-variant email import', () => {
    const OTHER_USER_ID = 'users-test-other';
    const EMAIL_ERROR = 'is already used by another user (letter case is ignored)';

    const createUser = (id, email) =>
      models.User.create({ ...fake(models.User), id, email, displayName: `Display ${id}` });

    beforeEach(async () => {
      await models.User.destroy({ where: { id: [TEST_USER_ID, OTHER_USER_ID] }, force: true });
    });

    it('rejects a new user whose email differs only in case from an existing user', async () => {
      await createUser(OTHER_USER_ID, 'case.variant@bes.au');

      const { didntSendReason, errors } = await doImport({
        file: 'user-email-upper-case',
        dryRun: false,
      });

      expect(didntSendReason).toEqual('validationFailed');
      expect(errors).toContainValidationError('user', 2, EMAIL_ERROR);
      expect(await models.User.findByPk(TEST_USER_ID)).toBeNull();
    });

    it('lets an existing user be re-imported with their own email in a different case', async () => {
      await createUser(TEST_USER_ID, 'case.variant@bes.au');

      const { errors, stats } = await doImport({ file: 'user-email-upper-case', dryRun: false });

      expect(errors).toHaveLength(0);
      expect(stats).toEqual({
        User: { created: 0, updated: 1, errored: 0, deleted: 0, restored: 0, skipped: 0 },
      });
      const user = await models.User.findByPk(TEST_USER_ID);
      expect(user.email).toEqual('CASE.VARIANT@BES.AU');
    });

    it('rejects two rows in one sheet whose emails differ only in case', async () => {
      const { didntSendReason, errors } = await doImport({
        file: 'user-email-case-variant-rows',
        dryRun: false,
      });

      expect(didntSendReason).toEqual('validationFailed');
      expect(errors).toContainValidationError('user', 2, EMAIL_ERROR);
      expect(errors).toContainValidationError('user', 3, EMAIL_ERROR);
    });

    it('still re-imports case-variant duplicates that already exist', async () => {
      await createUser(TEST_USER_ID, 'case.variant@bes.au');
      await createUser(OTHER_USER_ID, 'Case.Variant@BES.AU');

      const { errors } = await doImport({ file: 'user-email-case-variant-rows', dryRun: false });

      expect(errors).toHaveLength(0);
    });
  });
});
