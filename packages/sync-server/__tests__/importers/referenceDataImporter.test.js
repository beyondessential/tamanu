import { Op } from 'sequelize';
import { fake } from '@tamanu/shared/test-helpers/fake';
import {
  GENERAL_IMPORTABLE_DATA_TYPES,
  PERMISSION_IMPORTABLE_DATA_TYPES,
  DELETION_STATUSES,
} from '@tamanu/constants/importable';
import { getPermissionsForRoles } from '@tamanu/shared/permissions/rolesToPermissions';
import { createDummyPatient } from '@tamanu/shared/demoData/patients';
import { REFERENCE_TYPES } from '@tamanu/constants';
import { importerTransaction } from '../../app/admin/importerEndpoint';
import { referenceDataImporter } from '../../app/admin/referenceDataImporter';
import { createTestContext } from '../utilities';
import './matchers';
import { exporter } from '../../app/admin/exporter/exporter';
import { createAllergy, createDiagnosis } from '../exporters/referenceDataUtils';

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
      importer: referenceDataImporter,
      file: `./__tests__/importers/refdata-${file}.xlsx`,
      models: ctx.store.models,
      includedDataTypes: GENERAL_IMPORTABLE_DATA_TYPES,
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
      'ReferenceData/labSampleSite': { created: 18, updated: 0, errored: 0 },
      'ReferenceData/village': { created: 13, updated: 0, errored: 0 },
      'ReferenceData/procedureType': { created: 10, updated: 0, errored: 0 },
      'ReferenceData/specimenType': { created: 17, updated: 0, errored: 0 },
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
    expect(errors).toContainValidationError('user', 3, 'email is a required field');
    expect(errors).toContainValidationError('user', 4, 'displayName is a required field');
    expect(errors).toContainValidationError('user', 5, 'id is a required field');
  });

  it('should import user passwords correctly', async () => {
    // create our two existing users to see how their passwords
    // are affected

    // this user has a password change in the doc and should update
    const User = ctx.store.models.User.scope('withPassword');
    const beforeUserUpdate = await User.create({
      ...fake(User),
      id: 'existing-user-with-new-password',
    });
    const updateOldPassword = beforeUserUpdate.password;
    expect(updateOldPassword).toBeTruthy();

    // this user's password is blank in the doc and should stay intact
    const beforeUserBlank = await User.create({
      ...fake(User),
      id: 'existing-user-with-blank-password',
    });
    const blankOldPassword = beforeUserBlank.password;
    expect(blankOldPassword).toBeTruthy();

    // now actually do the import
    const { stats, errors } = await doImport({
      file: 'user-password',
    });
    expect(errors).toBeEmpty();
    expect(stats).toMatchObject({
      User: { created: 2, updated: 2 },
    });

    // "Update" user's password should have been updated
    const afterUserUpdate = await User.findByPk(beforeUserUpdate.id);
    expect(afterUserUpdate.password).toBeTruthy();
    expect(updateOldPassword).not.toEqual(afterUserUpdate.password);

    // "Blank" user's password should not have been changed (or blanked!)
    const afterUserBlank = await User.findByPk(beforeUserBlank.id);
    expect(afterUserBlank.password).toBeTruthy();
    expect(blankOldPassword).toEqual(afterUserBlank.password);
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

  it('should import patient field definition categories with a tab named "Patient Field Def Category"', async () => {
    const { errors, stats } = await doImport({ file: 'patient-field-definition-categories' });
    expect(errors).toBeEmpty();
    expect(stats).toMatchObject({
      PatientFieldDefinitionCategory: {
        created: 1,
        deleted: 0,
      },
    });
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

    const toFindCurrent = {
      noun: 'RevokeTest',
      deletionStatus: DELETION_STATUSES.CURRENT,
    };

    const toFindRevoked = {
      noun: 'RevokeTest',
      deletionStatus: DELETION_STATUSES.REVOKED,
    };

    const checkIfPermissionExists = async () => {
      const permissions = await getPermissionsForRoles(ctx.store.models, 'reception');
      expect(permissions).toEqual(expect.arrayContaining([{ noun: 'RevokeTest', verb: 'read' }]));
      expect(permissions.length).toBe(1);
    };

    const checkIfPermissionRevoked = async () => {
      const afterImport = await Permission.findOne({ where: toFindRevoked });
      expect(afterImport).toBeTruthy();
      const permissions = await getPermissionsForRoles(ctx.store.models, 'reception');
      expect(permissions).toEqual(
        expect.not.arrayContaining([{ noun: 'RevokeTest', verb: 'read' }]),
      );
      expect(permissions.length).toBe(0);
    };

    const beforeImport = await Permission.findOne({ where: toFindCurrent });
    expect(beforeImport).toBeFalsy();

    await doImport({ file: 'revoke-a' });
    await checkIfPermissionExists();

    await doImport({ file: 'revoke-b' });
    await checkIfPermissionRevoked();

    await doImport({ file: 'revoke-a' });
    await checkIfPermissionExists();
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

describe('Import from an exported file', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  function doImport(options) {
    const { file, ...opts } = options;
    return importerTransaction({
      importer: referenceDataImporter,
      file: `${file}`,
      models: ctx.store.models,
      includedDataTypes: GENERAL_IMPORTABLE_DATA_TYPES,
      ...opts,
    });
  }

  const clearData = async () => {
    const { ReferenceData, Patient, PatientFieldDefinitionCategory } = ctx.store.models;
    await ReferenceData.destroy({ where: {}, force: true });
    await Patient.destroy({ where: {}, force: true });
    await PatientFieldDefinitionCategory.destroy({ where: {}, force: true });
  };

  afterAll(() => ctx.close());

  afterEach(async () => {
    jest.clearAllMocks();
    await clearData();
  });

  it('Should export mixed Reference Data and other table data', async () => {
    const patientData = createDummyPatient(models);
    await models.Patient.create(patientData);
    await createDiagnosis(models);
    await createAllergy(models);
    const fileName = await exporter(
      models,
      {
        1: 'patient',
        2: REFERENCE_TYPES.ALLERGY,
        3: 'diagnosis',
      },
      './exported-refdata-all-table.xlsx',
    );

    // Remove all the data in order to test the import using the exported file
    await clearData();

    const { errors, stats } = await doImport({ file: fileName });
    expect(errors).toBeEmpty();
    expect(stats).toMatchObject({
      'ReferenceData/allergy': { created: 2, updated: 0, errored: 0 },
      'ReferenceData/diagnosis': { created: 2, updated: 0, errored: 0 },
      Patient: { created: 1, updated: 0, errored: 0 },
    });
  });
});
