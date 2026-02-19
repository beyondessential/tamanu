import { Op } from 'sequelize';

import { fake } from '@tamanu/fake-data/fake';
import {
  GENERAL_IMPORTABLE_DATA_TYPES,
  PERMISSION_IMPORTABLE_DATA_TYPES,
  OTHER_REFERENCE_TYPE_VALUES,
} from '@tamanu/constants/importable';
import { getPermissionsForRoles } from '@tamanu/shared/permissions/rolesToPermissions';
import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { getReferenceDataOptionStringId } from '@tamanu/shared/utils/translation';
import { REFERENCE_TYPES, REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants';

import { importerTransaction } from '../../dist/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../dist/admin/referenceDataImporter';
import { createTestContext } from '../utilities';
import './matchers';
import { exporter } from '../../dist/admin/exporter/exporter';
import { createAllergy, createDiagnosis } from '../exporters/referenceDataUtils';
import { camelCase } from 'lodash';
import { makeRoleWithPermissions } from '../permissions';
import { normaliseOptions } from '../../app/admin/importer/translationHandler';

// the importer can take a little while
jest.setTimeout(30000);

const BAD_ID_ERROR_MESSAGE = 'id must not have spaces or punctuation other than -';
const BAD_CODE_ERROR_MESSAGE = 'code must not have spaces or punctuation other than -./';
const BAD_VIS_ERROR_MESSAGE = `visibilityStatus must be one of the following values:`;

describe('Data definition import', () => {
  let ctx;
  let app;
  let models;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
    models = ctx.store.models;
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
      checkPermission: () => true,
      ...opts,
    });
  }

  describe('Permissions check', () => {
    beforeEach(async () => {
      const { Permission, Role } = ctx.store.models;
      await Permission.destroy({ where: {}, force: true });
      await Role.destroy({ where: {}, force: true });
    });

    it('forbids import if having insufficient permission for reference data', async () => {
      await makeRoleWithPermissions(models, 'practitioner', [
        { verb: 'write', noun: 'EncounterDiagnosis' },
      ]);

      const result = await app
        .post('/v1/admin/import/referenceData')
        .attach('file', './__tests__/importers/refdata-valid.xlsx')
        .field('includedDataTypes', 'allergy')
        .field('dryRun', true);

      const { didntSendReason, errors } = result.body;

      expect(didntSendReason).toEqual('validationFailed');
      expect(errors[0]).toHaveProperty(
        'message',
        `ForbiddenError: No permission to perform action "create" on "ReferenceData"`,
      );
    });

    it('allows import if having sufficient permission for reference data', async () => {
      await makeRoleWithPermissions(models, 'practitioner', [
        { verb: 'write', noun: 'ReferenceData' },
        { verb: 'create', noun: 'ReferenceData' },
      ]);

      const result = await app
        .post('/v1/admin/import/referenceData')
        .attach('file', './__tests__/importers/refdata-valid.xlsx')
        .field('includedDataTypes', 'allergy')
        .field('dryRun', true);

      const { didntSendReason, errors } = result.body;

      expect(didntSendReason).toEqual('dryRun');
      expect(errors).toBeEmpty();
    });
  });

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
    const { ReferenceData, TranslatedString } = ctx.store.models;
    const beforeCount = {
      referenceData: await ReferenceData.count(),
      translatedString: await TranslatedString.count(),
    };

    await doImport({ file: 'valid', dryRun: true });

    const afterCount = {
      referenceData: await ReferenceData.count(),
      translatedString: await TranslatedString.count(),
    };

    expect(beforeCount).toEqual(afterCount);
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

  describe('Translation', () => {
    it('should create translations records for the translatable reference data types', async () => {
      const { models } = ctx.store;
      const { ReferenceData, TranslatedString } = models;
      const { stats } = await doImport({ file: 'valid' });

      // It should create a translation for each record in the reference data table
      const refDataTableRecords = await ReferenceData.findAll({ raw: true });
      const expectedStringIds = refDataTableRecords.map(
        ({ type, id }) => `${REFERENCE_DATA_TRANSLATION_PREFIX}.${type}.${id}`,
      );

      // Filter out the clinical/patient record types as they dont get translated
      const translatableNonRefDataTableImports = Object.keys(stats).filter(key =>
        OTHER_REFERENCE_TYPE_VALUES.includes(camelCase(key)),
      );
      await Promise.all(
        translatableNonRefDataTableImports.map(async type => {
          const recordsForDataType = await models[type].findAll({
            attributes: ['id'],
            raw: true,
          });
          const nonRefDataTableStringIds = recordsForDataType.map(
            ({ id }) => `${REFERENCE_DATA_TRANSLATION_PREFIX}.${camelCase(type)}.${id}`,
          );
          expectedStringIds.push(...nonRefDataTableStringIds);
        }),
      );

      const createdTranslationCount = await TranslatedString.count({
        where: { stringId: { [Op.in]: expectedStringIds } },
      });
      expect(expectedStringIds.length).toEqual(createdTranslationCount);
    });

    it('should create nested translations for options', async () => {
      const { models } = ctx.store;
      await doImport({ file: 'valid' });

      // find an element with options
      const patientFieldDefinition = await models.PatientFieldDefinition.findOne({
        where: {
          options: {
            [Op.ne]: null,
          },
        },
      });

      if (!patientFieldDefinition)
        throw new Error('No patient field definition with options found in refdata-valid.xlsx');

      const translations = await models.TranslatedString.findAll({
        where: { stringId: { [Op.like]: 'refData.patientFieldDefinition%' } },
      });
      const stringIds = translations.map(translation => translation.stringId);

      const expectedStringIds = normaliseOptions(patientFieldDefinition.options).map(option =>
        getReferenceDataOptionStringId(patientFieldDefinition.id, 'patientFieldDefinition', option),
      );

      expect(stringIds).toEqual(expect.arrayContaining(expectedStringIds));
    });
  });

  describe('ReferenceDataRelations', () => {
    it('should allow deleting reference data relations', async () => {
      const { errors: createErrors, stats: createStats } = await doImport({
        file: 'valid-reference-data-relations',
        dryRun: false,
      });

      expect(createErrors).toBeEmpty();
      expect(createStats).toMatchObject({
        'ReferenceData/division': { created: 2, updated: 0, errored: 0 },
        'ReferenceData/subdivision': { created: 4, updated: 0, errored: 0 },
        ReferenceDataRelation: { created: 4, updated: 0, errored: 0 },
      });

      const relationsAfterCreate = await models.ReferenceDataRelation.findAll();
      expect(relationsAfterCreate).toHaveLength(4);

      const { errors: deleteErrors, stats: deleteStats } = await doImport({
        file: 'valid-reference-data-relations-deletes',
        dryRun: false,
      });

      expect(deleteErrors).toBeEmpty();
      expect(deleteStats).toMatchObject({
        ReferenceDataRelation: { deleted: 2, updated: 2, errored: 0 },
      });

      const relationsAfterDelete = await models.ReferenceDataRelation.findAll();
      expect(relationsAfterDelete).toHaveLength(2);
    });
  });

  it('should allow importing sensitive lab test types within the same lab test category', async () => {
    const { didntSendReason, errors, stats } = await doImport({
      file: 'valid-sensitive-lab-test-types',
      dryRun: true,
    });
    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toBeEmpty();
    expect(stats).toMatchObject({
      'ReferenceData/labTestCategory': { created: 1, updated: 0, errored: 0 },
      LabTestType: { created: 2, updated: 0, errored: 0 },
    });
  });

  it('should allow updating lab test types if all from category have the same sensitivity', async () => {
    await models.LabTestType.destroy({ where: {}, force: true });
    await models.ReferenceData.destroy({ where: { type: 'labTestCategory' }, force: true });
    const labTestCategory = await models.ReferenceData.create({
      id: 'labTestCategory-SensitiveCategory',
      type: 'labTestCategory',
      name: 'Sensitive category 1',
      code: 'SENSITIVECATEGORY1',
    });
    await models.LabTestType.create({
      labTestCategoryId: labTestCategory.id,
      id: 'labTestType-SensitiveTestOne',
      name: 'STONE',
      code: 'SensitiveTestOne',
      isSensitive: false,
    });
    await models.LabTestType.create({
      labTestCategoryId: labTestCategory.id,
      id: 'labTestType-SensitiveTestTwo',
      name: 'STTWO',
      code: 'SensitiveTestTwo',
      isSensitive: false,
    });

    const { didntSendReason, errors, stats } = await doImport({
      file: 'valid-sensitive-lab-test-types',
      dryRun: true,
    });
    await models.LabTestType.destroy({ where: {}, force: true });
    await models.ReferenceData.destroy({ where: { type: 'labTestCategory' }, force: true });
    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toBeEmpty();
    expect(stats).toMatchObject({
      'ReferenceData/labTestCategory': { created: 0, updated: 1, errored: 0 },
      LabTestType: { created: 0, updated: 2, errored: 0 },
    });
  });

  it('should error if not all lab test types are sensitive within the same lab test category (on the same spreadsheet)', async () => {
    const { didntSendReason, errors } = await doImport({
      file: 'invalid-sensitive-lab-test-types',
      dryRun: true,
    });
    expect(didntSendReason).toEqual('validationFailed');
    expect(errors).toContainValidationError(
      'labTestType',
      -1,
      'Only sensitive lab test types allowed in sensitive category',
    );
  });

  it('should error importing non sensitive lab test type to category containing sensitive test types', async () => {
    const labTestCategory = await models.ReferenceData.create({
      id: 'labTestCategory-SensitiveCategory',
      type: 'labTestCategory',
      name: 'Sensitive category 1',
      code: 'SENSITIVECATEGORY1',
    });

    await models.LabTestType.create({
      labTestCategoryId: labTestCategory.id,
      name: 'Sensitive test 1',
      code: 'SENSITIVETEST1',
      isSensitive: true,
    });

    const { didntSendReason, errors } = await doImport({
      file: 'invalid-non-sensitive-lab-test-type',
      dryRun: true,
    });
    expect(didntSendReason).toEqual('validationFailed');
    expect(errors).toContainValidationError(
      'labTestType',
      2,
      "Cannot add non sensitive lab test type to sensitive category 'labTestCategory-SensitiveCategory'",
    );
  });

  it('should error importing sensitive lab test type to category containing non sensitive test types', async () => {
    const labTestCategory = await models.ReferenceData.create({
      id: 'labTestCategory-NonSensitiveCategory',
      type: 'labTestCategory',
      name: 'Non sensitive category 1',
      code: 'NONSENSITIVECATEGORY1',
    });

    await models.LabTestType.create({
      labTestCategoryId: labTestCategory.id,
      name: 'Non sensitive test 1',
      code: 'NONSENSITIVETEST1',
    });

    // Try to add one non-sensitive lab test to previously uploaded sensitive category"
    const { didntSendReason, errors } = await doImport({
      file: 'invalid-sensitive-lab-test-type',
      dryRun: true,
    });
    expect(didntSendReason).toEqual('validationFailed');
    expect(errors).toContainValidationError(
      'labTestType',
      2,
      "Cannot add sensitive lab test type to non sensitive category 'labTestCategory-NonSensitiveCategory'",
    );
  });

  it('should import a lab test panel', async () => {
    const { didntSendReason, errors, stats } = await doImport({
      file: 'valid-lab-test-panel',
      dryRun: true,
    });
    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toBeEmpty();
    expect(stats).toMatchObject({
      'ReferenceData/labTestCategory': { created: 1, updated: 0, errored: 0 },
      LabTestType: { created: 5, updated: 0, errored: 0 },
      LabTestPanel: { created: 1, updated: 0, errored: 0 },
    });
  });

  it('should not import a lab test panel with a sensitive test', async () => {
    const { didntSendReason, errors } = await doImport({
      file: 'invalid-lab-test-panel-complete',
      dryRun: true,
    });
    expect(didntSendReason).toEqual('validationFailed');
    expect(errors).toContainValidationError(
      'labTestPanel',
      -1,
      'Lab test panels cannot contain sensitive lab test types',
    );
  });

  it('should not import a lab test panel referencing a sensitive test', async () => {
    await models.LabTestType.destroy({ where: {}, force: true });
    await models.ReferenceData.destroy({ where: { type: 'labTestCategory' }, force: true });
    const labTestCategory = await models.ReferenceData.create({
      id: 'labTestCategory-SensitiveCategory',
      type: 'labTestCategory',
      name: 'Sensitive category 1',
      code: 'SENSITIVECATEGORY1',
    });

    await models.LabTestType.create({
      labTestCategoryId: labTestCategory.id,
      id: 'labTestType-SensitiveTestOne',
      name: 'STONE',
      code: 'SensitiveTestOne',
      isSensitive: true,
    });

    await models.LabTestType.create({
      labTestCategoryId: labTestCategory.id,
      id: 'labTestType-SensitiveTestTwo',
      name: 'STTWO',
      code: 'SensitiveTestTwo',
      isSensitive: true,
    });

    const { didntSendReason, errors } = await doImport({
      file: 'invalid-lab-test-panel-partial',
      dryRun: true,
    });
    expect(didntSendReason).toEqual('validationFailed');
    expect(errors).toContainValidationError(
      'labTestPanel',
      -1,
      'Lab test panels cannot contain sensitive lab test types',
    );
  });

  describe('Invoice Product', () => {
    it('should import an invoice product', async () => {
      const { errors, stats } = await doImport({ file: 'valid-invoice-product', dryRun: true });
      expect(errors).toBeEmpty();
      expect(stats).toMatchObject({
        InvoiceProduct: { created: 1, updated: 0, errored: 0 },
      });
    });

    it('should import an invoice product which has a source record', async () => {
      const { errors, stats } = await doImport({
        file: 'valid-invoice-product-and-sources',
        dryRun: true,
      });
      expect(errors).toBeEmpty();
      expect(stats).toMatchObject({
        InvoiceProduct: { created: 6, updated: 0, errored: 0 },
      });
    });

    it('should not import an invoice product when the source record does not exist', async () => {
      const { stats, didntSendReason, errors } = await doImport({
        file: 'invalid-invoice-product-missing-source',
        dryRun: true,
      });
      expect(stats).toMatchObject({
        InvoiceProduct: { created: 1, updated: 0, errored: 1 },
      });
      expect(didntSendReason).toEqual('validationFailed');
      expect(errors).toContainValidationError(
        'invoiceProduct',
        2,
        'Source record with ID "Drug-love" and category "Drug" does not exist.',
      );
    });
  });

  describe('Procedure Type Survey', () => {
    let testSurvey1;
    let testSurvey2;

    beforeEach(async () => {
      await models.ProcedureTypeSurvey.destroy({ where: {}, force: true });
      await models.ReferenceData.destroy({ where: { type: 'procedureType' }, force: true });
      await models.Survey.destroy({ where: {}, force: true });

      testSurvey1 = await models.Survey.create({
        ...fake(models.Survey),
        id: 'test-survey-1', // id from the xlsx file
      });
      testSurvey2 = await models.Survey.create({
        ...fake(models.Survey),
        id: 'test-survey-2', // id from the xlsx file
      });
    });

    it('should import procedure type with formLink survey', async () => {
      const { errors } = await doImport({ file: 'procedure-type-form-link-add' });
      expect(errors).toBeEmpty();

      const procedureTypeSurveys = await models.ProcedureTypeSurvey.findAll();
      expect(procedureTypeSurveys).toHaveLength(2);
      expect(procedureTypeSurveys[0].surveyId).toEqual(testSurvey1.id);
      expect(procedureTypeSurveys[1].surveyId).toEqual(testSurvey2.id);
    });

    it('should be able to delete a formLink survey', async () => {
      // First, import to create the associations
      await doImport({ file: 'procedure-type-form-link-add' });
      let procedureTypeSurveys = await models.ProcedureTypeSurvey.findAll();
      expect(procedureTypeSurveys).toHaveLength(2);

      // Now, import a file that removes one of the associations
      const { errors } = await doImport({ file: 'procedure-type-form-link-delete' });
      expect(errors).toBeEmpty();

      procedureTypeSurveys = await models.ProcedureTypeSurvey.findAll();
      expect(procedureTypeSurveys).toHaveLength(1);
      expect(procedureTypeSurveys[0].surveyId).toEqual(testSurvey1.id);
    });

    it('should validate if the survey does not exist', async () => {
      const { didntSendReason, errors } = await doImport({
        file: 'procedure-type-form-link-invalid',
        dryRun: true,
      });
      expect(didntSendReason).toEqual('validationFailed');
      expect(errors).toContainValidationError(
        'procedureType',
        2,
        'Linked survey "test-survey-3" for procedure type "procedure-34830" not found.',
      );
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
      checkPermission: () => true,
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

    const beforeImport = await Permission.findOne({ where: { noun: 'User' } });
    expect(beforeImport).toBeFalsy();

    await doImport({ file: 'revoke-a' });

    const initialPermissions = await getPermissionsForRoles(ctx.store.models, 'reception');
    expect(initialPermissions).toEqual(expect.arrayContaining([{ noun: 'User', verb: 'read' }]));
    expect(initialPermissions.length).toBe(1);

    await doImport({ file: 'revoke-b' });

    const afterImport = await Permission.findOne({
      where: { noun: 'User' },
      paranoid: false,
    });
    expect(afterImport).toBeTruthy();
    const revokedPermissions = await getPermissionsForRoles(ctx.store.models, 'reception');
    expect(revokedPermissions).toEqual(
      expect.not.arrayContaining([{ noun: 'User', verb: 'read' }]),
    );
    expect(revokedPermissions.length).toBe(0);

    await doImport({ file: 'revoke-a' });

    const reinstatedPermissions = await getPermissionsForRoles(ctx.store.models, 'reception');
    expect(reinstatedPermissions).toEqual(expect.arrayContaining([{ noun: 'User', verb: 'read' }]));
    expect(reinstatedPermissions.length).toBe(1);
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
      checkPermission: () => true,
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
      { models },
      {
        1: 'patient',
        2: REFERENCE_TYPES.ALLERGY,
        3: 'diagnosis',
      },
      {},
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
