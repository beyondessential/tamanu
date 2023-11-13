import { PERMISSION_IMPORTABLE_DATA_TYPES } from '@tamanu/constants/importable';
import { Op } from 'sequelize';
import { importerTransaction } from '../../app/admin/importerEndpoint';
import { referenceDataImporter } from '../../app/admin/referenceDataImporter';
import { createTestContext } from '../utilities';
import './matchers';

// the importer can take a little while
jest.setTimeout(30000);

describe('Permissions import', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  beforeEach(async () => {
    const { Permission, Role } = ctx.store.models;
    await Permission.destroy({ where: {}, force: true });
    await Role.destroy({ where: {}, force: true });
  });
  afterAll(async () => {
    await ctx.close();
  });

  function doImport(options) {
    const { file, ...opts } = options;
    return importerTransaction({
      importer: referenceDataImporter,
      file: `./__tests__/importers/permissions-${file}.xlsx`,
      models: ctx.store.models,
      includedDataTypes: PERMISSION_IMPORTABLE_DATA_TYPES,
      ...opts,
    });
  }

  it('should succeed with valid data', async () => {
    const { didntSendReason, errors, stats } = await doImport({ file: 'valid', dryRun: true });

    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toBeEmpty();
    expect(stats).toMatchObject({
      Role: { created: 3, updated: 0, errored: 0 },
      Permission: { created: 35, updated: 0, errored: 0 },
    });
  });

  it('should properly import rows with object ID', async () => {
    const { Permission } = ctx.store.models;
    await doImport({ file: 'valid' });

    const permissionsCount = await Permission.count({ where: { objectId: { [Op.ne]: null } } });
    expect(permissionsCount).toEqual(6);
  });

  it('should not write anything for a dry run', async () => {
    const { Permission } = ctx.store.models;
    const beforeCount = await Permission.count();

    await doImport({ file: 'valid', dryRun: true });

    const afterCount = await Permission.count();
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
      `ENOENT: no such file or directory, open './__tests__/importers/permissions-nofile.xlsx'`,
    );
  });

  it('should validate permissions data', async () => {
    const { didntSendReason, errors } = await doImport({
      file: 'invalid',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');

    expect(errors).toContainValidationError(
      'permission',
      14,
      'duplicate id: reception-list-user-any',
    );
    expect(errors).toContainValidationError(
      'permission',
      16,
      'permissions matrix must only use the letter y or n',
    );
    expect(errors).toContainValidationError(
      'permission',
      19,
      'permissions matrix must only use the letter y or n',
    );
    expect(errors).toContainFkError(
      'permission',
      20,
      'valid foreign key expected in column role (corresponding to roleId) but found: invalid',
    );
  });

  it('should revoke (and reinstate) a permission', async () => {
    const { Permission } = ctx.store.models;

    const where = {
      noun: 'RevokeTest',
    };

    const beforeImport = await Permission.findOne({ where });
    expect(beforeImport).toBeFalsy();

    await doImport({ file: 'revoke-a' });

    const afterImport = await Permission.findOne({ where });
    expect(afterImport).toBeTruthy();
    expect(afterImport.deletedAt).toEqual(null);

    await doImport({ file: 'revoke-b' });

    const afterRevoke = await Permission.findOne({ where, paranoid: false });
    expect(afterRevoke).toBeTruthy();
    expect(afterRevoke.deletedAt).toBeTruthy();

    await doImport({ file: 'revoke-a' });

    const afterReinstate = await Permission.findOne({ where, paranoid: false });
    expect(afterReinstate).toBeTruthy();
    expect(afterReinstate.deletedAt).toEqual(null);
  });

  it('should not import rows specified in pages other than "Permissions"', async () => {
    const { didntSendReason, errors, stats } = await doImport({ file: 'old-format', dryRun: true });

    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toBeEmpty();
    expect(stats).toMatchObject({
      Role: { created: 3, updated: 0, errored: 0 },
      Permission: { created: 3, updated: 0, errored: 0 },
    });
  });
});
