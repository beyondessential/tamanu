import { Op } from 'sequelize';
import { importerTransaction } from '../../app/admin/importerEndpoint';
import { importer } from '../../app/admin/refdataImporter';
import { createTestContext } from '../utilities';
import './matchers';

// the importer can take a little while
jest.setTimeout(30000);

const BAD_ID_ERROR_MESSAGE = 'id must not have spaces or punctuation other than -';
const BAD_CODE_ERROR_MESSAGE = 'code must not have spaces or punctuation other than -./';
const BAD_VIS_ERROR_MESSAGE = `visibilityStatus must be one of the following values:`;

describe('Data definition import', () => {
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
      file: `./__tests__/importers/refdata-${file}.xlsx`,
      models: ctx.store.models,
      ...opts,
    });
  }

  it('should succeed with valid data', async () => {
    const { didntSendReason, errors, stats } = await doImport({ file: 'valid', dryRun: true });

    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toBeEmpty();
    expect(stats).toMatchObject({
      'ReferenceData/allergy': { created: 10, updated: 0, errored: 0 },
      'ReferenceData/diagnosis': { created: 10, updated: 0, errored: 0 },
      'ReferenceData/drug': { created: 10, updated: 0, errored: 0 },
      'ReferenceData/triageReason': { created: 10, updated: 0, errored: 0 },
      'ReferenceData/imagingType': { created: 4, updated: 0, errored: 0 },
      'ReferenceData/labTestCategory': { created: 5, updated: 0, errored: 0 },
      'ReferenceData/labSampleSite': { created: 19, updated: 0, errored: 0 },
      'ReferenceData/village': { created: 13, updated: 0, errored: 0 },
      'ReferenceData/procedureType': { created: 10, updated: 0, errored: 0 },
      User: { created: 10, updated: 0, errored: 0 },
      Facility: { created: 10, updated: 0, errored: 0 },
      ScheduledVaccine: { created: 1, updated: 0, errored: 0 },
      LabTestType: { created: 10, updated: 0, errored: 0 },
      Patient: { created: 10, updated: 0, errored: 0 },
      Department: { created: 10, updated: 0, errored: 0 },
      Location: { created: 10, updated: 0, errored: 0 },
      Encounter: { created: 2, updated: 0, errored: 0 },
      AdministeredVaccine: { created: 2, updated: 0, errored: 0 },
    });
  });

  it('should not write anything for a dry run', async () => {
    const { ReferenceData } = ctx.store.models;
    const beforeCount = await ReferenceData.count();

    await doImport({ file: 'valid', dryRun: true });

    const afterCount = await ReferenceData.count();
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
      `ENOENT: no such file or directory, open './__tests__/importers/refdata-nofile.xlsx'`,
    );
  });

  it('should validate reference data', async () => {
    const { didntSendReason, errors } = await doImport({
      file: 'invalid-refdata',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');

    expect(errors).toContainValidationError('village', 3, 'code is a required field');
    expect(errors).toContainValidationError('village', 4, 'name is a required field');
    expect(errors).toContainValidationError('village', 5, BAD_ID_ERROR_MESSAGE);
    expect(errors).toContainValidationError('village', 6, BAD_VIS_ERROR_MESSAGE);
    expect(errors).toContainValidationError('village', 7, 'id is a required field');

    expect(errors).toContainValidationError('diagnosis', 3, BAD_CODE_ERROR_MESSAGE);
    expect(errors).toContainValidationError('triageReason', 4, 'duplicate id: triage-dupeid');
    expect(errors).toContainValidationError('triageReason', 5, BAD_ID_ERROR_MESSAGE);
  });

  it('should validate locations', async () => {
    const { didntSendReason, errors } = await doImport({
      file: 'invalid-locations',
      dryRun: true,
    });
    expect(didntSendReason).toEqual('validationFailed');
    expect(errors).toContainValidationError('location', 2, 'code is a required field');
    expect(errors).toContainValidationError('location', 3, 'name is a required field');
    expect(errors).toContainValidationError('location', 4, 'facilityId is a required field');
    expect(errors).toContainValidationError('location', 5, 'maxOccupancy above 1 is unimplemented');
    expect(errors).toContainValidationError(
      'location',
      6,
      'maxOccupancy must be 1 or null for unrestricted occupancy',
    );
  });

  // as example of non-refdata import
  it('should validate users', async () => {
    const { didntSendReason, errors } = await doImport({
      file: 'invalid-users',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');
    expect(errors).toContainValidationError('user', 2, 'password is a required field');
    expect(errors).toContainValidationError('user', 3, 'email is a required field');
    expect(errors).toContainValidationError('user', 4, 'displayName is a required field');
    expect(errors).toContainValidationError('user', 5, 'id is a required field');
  });

  it('should validate foreign keys', async () => {
    const { didntSendReason, errors } = await doImport({
      file: 'invalid-fk',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');
    expect(errors).toContainFkError(
      'patient',
      4,
      'valid foreign key expected in column village (corresponding to villageId) but found: village-nowhere',
    );
    expect(errors).toContainFkError(
      'patient',
      5,
      'valid foreign key expected in column village (corresponding to villageId) but found: drug-id',
    );
  });

  it('should import visibility status', async () => {
    const { ReferenceData } = ctx.store.models;

    const { stats, errors } = await doImport({
      file: 'valid-visibility',
    });

    expect(errors).toBeEmpty();
    expect(stats).toMatchObject({
      'ReferenceData/village': { created: 3, updated: 0, errored: 0 },
    });

    const visible = await ReferenceData.findOne({ where: { id: 'village-visible' } });
    const defaultVis = await ReferenceData.findOne({ where: { id: 'village-default-visible' } });
    const historical = await ReferenceData.findOne({ where: { id: 'village-historical' } });

    expect(visible).toHaveProperty('visibilityStatus', 'current');
    expect(defaultVis).toHaveProperty('visibilityStatus', 'current');
    expect(historical).toHaveProperty('visibilityStatus', 'historical');
  });

  it('should import if column headings are padded with whitespace', async () => {
    const { ReferenceData } = ctx.store.models;
    const { errors, stats } = await doImport({
      file: 'valid-whitespace',
    });
    expect(errors).toBeEmpty();
    expect(stats).toMatchObject({
      'ReferenceData/village': { created: 3, updated: 0, errored: 0 },
    });
    const historical = await ReferenceData.findOne({
      where: { id: 'village-historical-whitespace' },
    });
    expect(historical).toHaveProperty('visibilityStatus', 'historical');
  });

  it('should hash user passwords on creates', async () => {
    const { User } = ctx.store.models;
    const testUserPre = await User.findByPk('test-password-hashing');
    if (testUserPre) await testUserPre.destroy();

    const { errors } = await doImport({ file: 'valid-userpassword' });
    expect(errors).toBeEmpty();

    const testUser = await User.scope('withPassword').findByPk('test-password-hashing');
    const password = testUser.get('password', { raw: true });
    expect(password).not.toEqual('plaintext');
    expect(password).toEqual(expect.stringMatching(/^\$2/)); // magic number for bcrypt hashes
  });

  it('should hash user passwords on updates', async () => {
    const { User } = ctx.store.models;

    let testUserPre = await User.scope('withPassword').findByPk('test-password-hashing');
    if (!testUserPre) {
      await User.create({
        id: 'test-password-hashing',
        password: 'something',
        email: 'test-password-hashing@tamanu.io',
        displayName: 'test-password-hashing',
      });
      testUserPre = await User.scope('withPassword').findByPk('test-password-hashing');
    }
    const passwordPre = testUserPre.get('password', { raw: true });
    expect(passwordPre).toEqual(expect.stringMatching(/^\$2/)); // sanity check

    const { errors } = await doImport({ file: 'valid-userpassword' });
    expect(errors).toBeEmpty();

    const testUser = await User.scope('withPassword').findByPk('test-password-hashing');
    const password = testUser.get('password', { raw: true });
    expect(password).not.toEqual('plaintext');
    expect(password).toEqual(expect.stringMatching(/^\$2/)); // magic number for bcrypt hashes
    expect(password).not.toEqual(passwordPre); // make sure it's updated
  });

  it('should forbid an import by a non-admin', async () => {
    const { baseApp } = ctx;
    const nonAdminApp = await baseApp.asRole('practitioner');

    const response = await nonAdminApp.post('/v1/admin/importRefData');
    expect(response).toBeForbidden();
  });
});

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
      importer,
      file: `./__tests__/importers/permissions-${file}.xlsx`,
      models: ctx.store.models,
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
