import { fake } from '@tamanu/fake-data/fake';
import { findOneOrCreate } from '@tamanu/shared/test-helpers/factory';
import { PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '@tamanu/constants';

import { importerTransaction } from '../../dist/admin/importer/importerEndpoint';
import { programImporter } from '../../dist/admin/programImporter';
import { autoFillConditionCategoryImport } from '../../dist/admin/programImporter/autoFillConditionCategoryImport';
import { createTestContext } from '../utilities';
import './matchers';

// the importer can take a little while
jest.setTimeout(60000);

describe('Programs import - Program Registry', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });

  beforeEach(async () => {
    const {
      Program,
      Survey,
      PatientProgramRegistration,
      ProgramRegistryClinicalStatus,
      ProgramRegistryCondition,
      ProgramRegistryConditionCategory,
      ProgramRegistry,
      ProgramDataElement,
      SurveyScreenComponent,
    } = ctx.store.models;
    await PatientProgramRegistration.destroy({ where: {}, force: true });
    await ProgramRegistryClinicalStatus.destroy({ where: {}, force: true });
    await ProgramRegistryCondition.destroy({ where: {}, force: true });
    await ProgramRegistryConditionCategory.destroy({ where: {}, force: true });
    await ProgramRegistry.destroy({ where: {}, force: true });
    await SurveyScreenComponent.destroy({ where: {}, force: true });
    await ProgramDataElement.destroy({ where: {}, force: true });
    await Survey.destroy({ where: {}, force: true });
    await Program.destroy({ where: {}, force: true });
  });
  afterAll(async () => {
    await ctx.close();
  });

  function doImport(options) {
    const { file, xml = false, ...opts } = options;
    return importerTransaction({
      importer: programImporter,
      file: `./__tests__/importers/programs-${file}${xml ? '.xml' : '.xlsx'}`,
      models: ctx.store.models,
      checkPermission: () => true,
      ...opts,
    });
  }

  it('should import a valid registry', async () => {
    const { errors, stats, didntSendReason } = await doImport({
      file: 'registry-valid-village',
      xml: true,
      dryRun: true,
    });
    expect(errors).toBeEmpty();
    expect(didntSendReason).toEqual('dryRun');
    expect(stats).toMatchObject({
      Program: { created: 1, updated: 0, errored: 0 },
      Survey: { created: 1, updated: 0, errored: 0 },
      ProgramDataElement: { created: 1, updated: 0, errored: 0 },
      SurveyScreenComponent: { created: 1, updated: 0, errored: 0 },
      ProgramRegistry: { created: 1, updated: 0, errored: 0 },
      ProgramRegistryClinicalStatus: { created: 3, updated: 0, errored: 0 },
    });
  });

  it('should properly update clinical statuses', async () => {
    await doImport({ file: 'registry-valid-village', xml: true, dryRun: false });
    const { didntSendReason, errors, stats } = await doImport({
      file: 'registry-update-statuses',
      xml: true,
      dryRun: true,
    });

    expect(errors).toBeEmpty();
    expect(didntSendReason).toEqual('dryRun');
    expect(stats).toMatchObject({
      Program: { created: 0, skipped: 1, errored: 0 },
      Survey: { created: 0, skipped: 1, errored: 0 },
      ProgramRegistry: { created: 0, skipped: 1, errored: 0 },
      ProgramRegistryClinicalStatus: { created: 1, skipped: 1, updated: 2, errored: 0 },
    });
  });

  it('should error on invalid currentlyAtType', async () => {
    const { errors } = await doImport({
      file: 'registry-invalid-currently-at-type',
      xml: true,
      dryRun: true,
    });

    expect(errors[0].message).toEqual(
      'Validation error: The currentlyAtType must be one of village, facility on Registry at row 0',
    );
  });

  it('should enforce unique name', async () => {
    await doImport({ file: 'registry-valid-village', xml: true, dryRun: false });
    const { errors } = await doImport({
      file: 'registry-duplicated-name',
      xml: true,
      dryRun: true,
    });

    expect(errors[0].message).toEqual(
      'A registry name must be unique (name: Valid Registry, conflicting code: ValidRegistry) on Registry at row 0',
    );
  });

  it('should restrict colors to a set list', async () => {
    const { errors } = await doImport({
      file: 'registry-invalid-clinical-status-color',
      xml: true,
      dryRun: false,
    });
    expect(errors[0].message).toEqual(
      'color must be one of the following values: purple, pink, orange, yellow, blue, green, grey, red, brown, teal on Registry at row 9',
    );
  });

  it('should not enforce unique name for historical registries', async () => {
    await doImport({ file: 'registry-valid-village', xml: true, dryRun: false });
    await doImport({ file: 'registry-make-historical', xml: true, dryRun: false });
    const { errors } = await doImport({
      file: 'registry-duplicated-name',
      xml: true,
      dryRun: true,
    });
    expect(errors).toBeEmpty();
  });

  it('should prevent changing currentlyAtType if there is existing data', async () => {
    const { Patient, PatientProgramRegistration } = ctx.store.models;
    await doImport({
      file: 'registry-valid-village',
      xml: true,
      dryRun: false,
    });
    const patient = await Patient.create(fake(Patient));
    await findOneOrCreate(ctx.store.models, PatientProgramRegistration, {
      programRegistryId: 'programRegistry-ValidRegistry',
      patientId: patient.id,
    });
    const { errors } = await doImport({
      file: 'registry-valid-facility',
      xml: true,
      dryRun: false,
    });
    expect(errors[0].message).toEqual(
      'Cannot update the currentlyAtType of a program registry with existing data on Registry at row 0',
    );
  });

  it('should not prevent changing currentlyAtType if there is no existing data', async () => {
    const { Patient, PatientProgramRegistration } = ctx.store.models;
    await doImport({
      file: 'registry-valid-village',
      xml: true,
      dryRun: false,
    });
    const patient = await Patient.create(fake(Patient));
    const registration = await findOneOrCreate(ctx.store.models, PatientProgramRegistration, {
      programRegistryId: 'programRegistry-ValidRegistry',
      patientId: patient.id,
    });
    registration.villageId = null;
    registration.facilityId = null;
    await registration.save();
    const { errors } = await doImport({
      file: 'registry-valid-facility',
      xml: true,
      dryRun: false,
    });
    expect(errors).toBeEmpty();
  });

  it('should validate survey patient data fieldName based on registry currentlyAtType', async () => {
    const { errors } = await doImport({
      file: 'registry-invalid-patient-data-q-wrong-fieldName',
      xml: true,
      dryRun: false,
    });
    expect(errors).not.toBeEmpty();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(
      'config: writeToPatient.fieldName=registrationCurrentlyAtFacility but program registry configured for village on Import Registry With Survey at row 3',
    );
  });

  it('should validate survey patient data fieldName based on if a registry exists', async () => {
    const { errors } = await doImport({
      file: 'registry-invalid-patient-data-q-no-registry',
      xml: true,
      dryRun: false,
    });
    expect(errors).not.toBeEmpty();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(
      'config: column=registrationClinicalStatus but no program registry configured on Import Registry With Survey at row 3',
    );
  });

  describe('conditions', () => {
    it('should import valid conditions', async () => {
      const { errors, stats } = await doImport({
        file: 'registry-valid-with-conditions',
        xml: true,
        dryRun: false,
      });
      expect(errors).toBeEmpty();
      expect(stats).toMatchObject({
        Program: { created: 1, updated: 0, errored: 0 },
        ProgramRegistry: { created: 1, updated: 0, errored: 0 },
        ProgramRegistryClinicalStatus: { created: 3, updated: 0, errored: 0 },
        ProgramRegistryCondition: { created: 2, updated: 0, errored: 0 },
      });
    });

    it('should validate conditions', async () => {
      const { errors, stats } = await doImport({
        file: 'registry-invalid-conditions',
        xml: true,
        dryRun: false,
      });

      const errorMessages = [
        'visibilityStatus must be one of the following values: current, historical, merged on Registry Conditions at row 2',
        'id must not have spaces or punctuation other than - on Registry Conditions at row 3',
        'code must not have spaces or punctuation other than -./ on Registry Conditions at row 3',
        'name is a required field on Registry Conditions at row 3',
      ];
      expect(errors.length).toBe(4);
      errors.forEach((error, i) => {
        expect(error.message).toEqual(errorMessages[i]);
      });
      expect(stats).toMatchObject({
        Program: { created: 1, updated: 0, errored: 0 },
        ProgramRegistry: { created: 1, updated: 0, errored: 0 },
        ProgramRegistryClinicalStatus: { created: 3, updated: 0, errored: 0 },
        ProgramRegistryCondition: { created: 0, updated: 0, errored: 2 },
      });
    });
  });

  describe('condition categories', () => {
    it('should create category rows from spreadsheet when they match hardcoded categories', async () => {
      // Create a mock context with models
      const context = { models: ctx.store.models };

      // Create test data that matches hardcoded categories
      const spreadsheetCategories = [
        {
          code: PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
          name: 'Custom Unknown',
          visibilityStatus: 'current',
          __rowNum__: 2,
        },
      ];

      const registryId = 'test-registry-id';

      const result = await autoFillConditionCategoryImport(
        context,
        spreadsheetCategories,
        registryId,
      );

      // Verify the result
      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({
        model: 'ProgramRegistryConditionCategory',
        sheetRow: 1, // __rowNum__ - 1
        values: {
          id: `program-registry-condition-category-${registryId}-${PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN}`,
          programRegistryId: registryId,
          code: PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
          name: 'Custom Unknown',
          visibilityStatus: 'current',
        },
      });
    });

    it('should create category rows from hardcoded values when not in spreadsheet', async () => {
      // Create a mock context with models
      const context = {
        models: {
          ...ctx.store.models,
          ProgramRegistryConditionCategory: {
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
      };

      // Empty spreadsheet categories
      const spreadsheetCategories = [];

      const registryId = 'test-registry-id';

      const result = await autoFillConditionCategoryImport(
        context,
        spreadsheetCategories,
        registryId,
      );

      // Verify the result - should have one entry for each hardcoded category
      expect(result).toHaveLength(Object.keys(PROGRAM_REGISTRY_CONDITION_CATEGORIES).length);

      // Check one of the entries
      const unknownCategory = result.find(
        row => row.values.code === PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
      );
      expect(unknownCategory).toMatchObject({
        model: 'ProgramRegistryConditionCategory',
        sheetRow: -1, // Indicates hardcoded
        values: {
          id: `program-registry-condition-category-${registryId}-${PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN}`,
          programRegistryId: registryId,
          code: PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
          visibilityStatus: 'current',
        },
      });
    });

    it('should not create category rows for existing database entries', async () => {
      // Create a mock context with models that returns existing entries
      const existingCategory = {
        id: 'existing-category',
        code: PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
        programRegistryId: 'test-registry-id',
      };

      const context = {
        models: {
          ...ctx.store.models,
          ProgramRegistryConditionCategory: {
            findOne: jest.fn().mockImplementation(async ({ where }) => {
              if (where.code === PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN) {
                return existingCategory;
              }
              return null;
            }),
          },
        },
      };

      // Empty spreadsheet categories
      const spreadsheetCategories = [];

      const registryId = 'test-registry-id';

      const result = await autoFillConditionCategoryImport(
        context,
        spreadsheetCategories,
        registryId,
      );

      // Verify the result - should have entries for all hardcoded categories except UNKNOWN
      expect(result).toHaveLength(Object.keys(PROGRAM_REGISTRY_CONDITION_CATEGORIES).length - 1);

      // Make sure the UNKNOWN category is not in the result
      const unknownCategory = result.find(
        row => row.values.code === PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
      );
      expect(unknownCategory).toBeUndefined();
    });

    it('should include additional categories from spreadsheet', async () => {
      // Create a mock context with models
      const context = { models: ctx.store.models };

      // Create test data with an additional category not in hardcoded list
      const spreadsheetCategories = [
        {
          code: 'custom-category',
          name: 'Custom Category',
          visibilityStatus: 'current',
          __rowNum__: 2,
        },
      ];

      const registryId = 'test-registry-id';

      const result = await autoFillConditionCategoryImport(
        context,
        spreadsheetCategories,
        registryId,
      );

      // Verify the result - should have entries for all hardcoded categories plus the custom one
      expect(result).toHaveLength(Object.keys(PROGRAM_REGISTRY_CONDITION_CATEGORIES).length + 1);

      // Check the custom category
      const customCategory = result.find(row => row.values.code === 'custom-category');
      expect(customCategory).toMatchObject({
        model: 'ProgramRegistryConditionCategory',
        sheetRow: 1, // __rowNum__ - 1
        values: {
          id: `program-registry-condition-category-${registryId}-custom-category`,
          programRegistryId: registryId,
          code: 'custom-category',
          name: 'Custom Category',
          visibilityStatus: 'current',
        },
      });
    });
  });
});
