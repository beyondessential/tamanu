import { Op } from 'sequelize';

import { fake } from '@tamanu/fake-data/fake';
import { findOneOrCreate } from '@tamanu/shared/test-helpers/factory';
import {
  SURVEY_TYPES,
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  REFERENCE_DATA_TRANSLATION_PREFIX,
} from '@tamanu/constants';
import { getReferenceDataOptionStringId } from '@tamanu/shared/utils/translation';

import { importerTransaction } from '../../dist/admin/importer/importerEndpoint';
import { programImporter } from '../../dist/admin/programImporter';
import { autoFillConditionCategoryImport } from '../../dist/admin/programImporter/autoFillConditionCategoryImport';
import { createTestContext } from '../utilities';
import { makeRoleWithPermissions } from '../permissions';
import './matchers';
import { normaliseOptions } from '../../app/admin/importer/translationHandler';

// the importer can take a little while
jest.setTimeout(60000);

describe('Programs import', () => {
  let ctx;
  let app;
  let models;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
    models = ctx.store.models;
  });

  const truncateTables = async () => {
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
      TranslatedString,
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
    await TranslatedString.destroy({ where: {}, force: true });
  };

  beforeEach(async () => {
    await truncateTables();
  });
  afterAll(async () => {
    await truncateTables();
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

  describe('Permissions check', () => {
    beforeEach(async () => {
      const { Permission, Role } = ctx.store.models;
      await Permission.destroy({ where: {}, force: true });
      await Role.destroy({ where: {}, force: true });
    });

    it('forbids import if having insufficient permission for programs and surveys', async () => {
      await makeRoleWithPermissions(models, 'practitioner', [
        { verb: 'write', noun: 'EncounterDiagnosis' },
      ]);

      const result = await app
        .post('/v1/admin/import/program')
        .attach(`./__tests__/importers/programs-valid.xlsx`)
        .field('includedDataTypes', 'program');

      const { didntSendReason, errors } = result.body;

      expect(didntSendReason).toEqual('validationFailed');
      expect(errors[0]).toHaveProperty(
        'message',
        `ForbiddenError: No permission to perform action "create" on "Program"`,
      );
    });

    it('allows import if having sufficient permission for programs and surveys', async () => {
      await makeRoleWithPermissions(models, 'practitioner', [
        { verb: 'write', noun: 'Program' },
        { verb: 'create', noun: 'Program' },
        { verb: 'write', noun: 'Survey' },
        { verb: 'create', noun: 'Survey' },
      ]);

      const result = await app
        .post('/v1/admin/import/program')
        .attach('file', './__tests__/importers/programs-valid.xlsx')
        .field('includedDataTypes', 'program');

      const { didntSendReason, errors } = result.body;

      expect(didntSendReason).toBeUndefined();
      expect(errors).toBeEmpty();
    });
  });

  it('should succeed with valid data', async () => {
    const { didntSendReason, errors, stats } = await doImport({ file: 'valid', dryRun: true });

    expect(errors).toBeEmpty();
    expect(didntSendReason).toEqual('dryRun');
    expect(stats).toMatchObject({
      Program: { created: 1, updated: 0, errored: 0 },
      Survey: { created: 1, updated: 0, errored: 0 },
      ProgramDataElement: { created: 21, updated: 0, errored: 0 },
      SurveyScreenComponent: { created: 21, updated: 0, errored: 0 },
    });
  });

  it('should ignore obsolete surveys worksheets', async () => {
    const { didntSendReason, errors, stats } = await doImport({ file: 'obsolete', dryRun: true });

    expect(errors).toBeEmpty();
    expect(didntSendReason).toEqual('dryRun');
    expect(stats).toMatchObject({
      Program: { created: 1, updated: 0, errored: 0 },
      Survey: { created: 1, updated: 0, errored: 0 },
    });
  });

  it('should properly update surveys as obsolete', async () => {
    await doImport({ file: 'valid', dryRun: false });
    const { didntSendReason, errors, stats } = await doImport({ file: 'obsolete', dryRun: true });

    expect(errors).toBeEmpty();
    expect(didntSendReason).toEqual('dryRun');
    expect(stats).toMatchObject({
      Program: { created: 0, updated: 1, errored: 0 },
      Survey: { created: 0, updated: 1, errored: 0 },
    });
  });

  it('should properly skip surveys as obsolete', async () => {
    await doImport({ file: 'valid', dryRun: false });
    await doImport({ file: 'obsolete', dryRun: false });
    const { didntSendReason, errors, stats } = await doImport({ file: 'obsolete-clone', dryRun: true });
    console.log('stats', stats);
    expect(errors).toBeEmpty();
    expect(didntSendReason).toEqual('dryRun');
    expect(stats).toMatchObject({
      Program: { created: 0, skipped: 1, errored: 0 },
      Survey: { created: 0, skipped: 1, errored: 0 },
    });
  });

  it('should soft delete survey questions', async () => {
    const { Survey, SurveyScreenComponent } = ctx.store.models;

    const getComponents = async () => {
      const survey = await Survey.findByPk('program-testprogram-deletion');
      expect(survey).toBeTruthy();
      return SurveyScreenComponent.findAll({
        where: {
          surveyId: survey.id,
          visibilityStatus: 'current',
        },
      });
    };

    {
      const { errors, stats } = await doImport({ file: 'deleteQuestions' });
      expect(errors).toBeEmpty();
      expect(stats).toMatchObject({
        ProgramDataElement: { created: 3 },
        SurveyScreenComponent: { created: 3 },
      });
    }

    // find imported ssc
    const componentsBefore = await getComponents();
    expect(componentsBefore).toHaveLength(3);

    {
      const { errors, stats } = await doImport({ file: 'deleteQuestions-2' });
      expect(errors).toBeEmpty();
      expect(stats).toMatchObject({
        ProgramDataElement: { updated: 3 },
        SurveyScreenComponent: { skipped: 1, deleted: 2 },
      });
    }

    const componentsAfter = await getComponents();
    // of the three in the import doc:
    //  - one is not deleted
    //  - two is set to visibilityStatus = 'deleted'
    expect(componentsAfter).toHaveLength(1);
  });

  it('should not write anything for a dry run', async () => {
    const { ProgramDataElement } = ctx.store.models;
    const beforeCount = await ProgramDataElement.count();

    await doImport({ file: 'valid', dryRun: true });

    const afterCount = await ProgramDataElement.count();
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
      `ENOENT: no such file or directory, open './__tests__/importers/programs-nofile.xlsx'`,
    );
  });

  it('should error on invalid import status', async () => {
    const { didntSendReason, errors } = await doImport({
      file: 'invalid-survey-status',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');

    expect(errors[0]).toHaveProperty(
      'message',
      'Survey Samoa PEN Referral Example has invalid status not-a-status. Must be one of publish, draft, hidden. on Metadata at row 8',
    );
  });

  it('should error on invalid calculations', async () => {
    const { didntSendReason, errors, stats } = await doImport({
      file: 'calculation-validation',
      dryRun: true,
    });
    expect(didntSendReason).toEqual('validationFailed');
    expect(stats).toMatchObject({
      Program: { created: 1, updated: 0, errored: 0 },
      Survey: { created: 1, updated: 0, errored: 0 },
      ProgramDataElement: { created: 6, updated: 0, errored: 0 },
      SurveyScreenComponent: { created: 4, updated: 0, errored: 2 }, // 2 invalid calculations
    });
    expect(errors.length).toEqual(2);
  });

  describe('run validation against question configs', () => {
    let didntSendReason;
    let errors;
    let stats;

    beforeAll(async () => {
      ({ didntSendReason, errors, stats } = await doImport({
        file: 'question-validation',
        xml: true,
        dryRun: true,
      }));
    });

    const expectedErrorMessages = [
      'validationCriteria: this field has unspecified keys: foo on Question Validation Fail at row 2',
      'validationCriteria: mandatory must be a `object` type, but the final value was: `"true"`. on Question Validation Fail at row 3',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 4',
      'config: unit must be a `string` type, but the final value was: `true`. on Question Validation Fail at row 5',
      'validationCriteria: this field has unspecified keys: foo on Question Validation Fail at row 6',
      'validationCriteria: mandatory must be a `object` type, but the final value was: `"true"`. on Question Validation Fail at row 7',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 8',
      'config: unit must be a `string` type, but the final value was: `true`. on Question Validation Fail at row 9',
      'validationCriteria: this field has unspecified keys: foo on Question Validation Fail at row 10',
      'validationCriteria: mandatory must be a `object` type, but the final value was: `"true"`. on Question Validation Fail at row 11',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 12',
      'config: unit must be a `string` type, but the final value was: `true`. on Question Validation Fail at row 13',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 14',
      'config: column must be one of the following values: registrationClinicalStatus, programRegistrationStatus, registrationClinician, registeringFacility, registrationCurrentlyAtVillage, registrationCurrentlyAtFacility, firstName, middleName, lastName, culturalName, dateOfBirth, dateOfDeath, sex, email, villageId, placeOfBirth, bloodType, primaryContactNumber, secondaryContactNumber, maritalStatus, cityTown, streetVillage, educationalLevel, socialMedia, title, birthCertificate, drivingLicense, passport, emergencyContactName, emergencyContactNumber, registeredById, motherId, fatherId, nationalityId, countryId, divisionId, subdivisionId, medicalAreaId, nursingZoneId, settlementId, ethnicityId, occupationId, religionId, patientBillingTypeId, countryOfBirthId, age, ageWithMonths, fullName on Question Validation Fail at row 15',
      'config: writeToPatient.fieldName must be one of the following values: registrationClinicalStatus, programRegistrationStatus, registrationClinician, registeringFacility, registrationCurrentlyAtVillage, registrationCurrentlyAtFacility, firstName, middleName, lastName, culturalName, dateOfBirth, dateOfDeath, sex, email, villageId, placeOfBirth, bloodType, primaryContactNumber, secondaryContactNumber, maritalStatus, cityTown, streetVillage, educationalLevel, socialMedia, title, birthCertificate, drivingLicense, passport, emergencyContactName, emergencyContactNumber, registeredById, motherId, fatherId, nationalityId, countryId, divisionId, subdivisionId, medicalAreaId, nursingZoneId, settlementId, ethnicityId, occupationId, religionId, patientBillingTypeId, countryOfBirthId on Question Validation Fail at row 16',
      'config: writeToPatient.fieldType is a required field on Question Validation Fail at row 17',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 18',
      'config: column must be a `string` type, but the final value was: `24`. on Question Validation Fail at row 19',
      'config: column is a required field on Question Validation Fail at row 20',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 21',
      'config: source must be a `string` type, but the final value was: `true`. on Question Validation Fail at row 22',
      'config: where is a required field on Question Validation Fail at row 23',
      'config: source is a required field on Question Validation Fail at row 24',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 25',
      'config: source must be a `string` type, but the final value was: `true`. on Question Validation Fail at row 26',
      'config: source is a required field on Question Validation Fail at row 27',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 28',
      'config: source must be a `string` type, but the final value was: `true`. on Question Validation Fail at row 29',
      'config: source is a required field on Question Validation Fail at row 30',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 31',
      'config: source must be a `string` type, but the final value was: `true`. on Question Validation Fail at row 32',
      'config: source is a required field on Question Validation Fail at row 33',
      'config: isAdditionalDataField is deprecated in Tamanu 2.1, it is now just inferred from the fieldName on Question Validation Fail at row 34',
    ];

    expectedErrorMessages.forEach((message, i) => {
      test(`Error at row: ${i + 1}`, () => {
        expect(errors[i].message).toEqual(message);
      });
    });

    test('didntSendReason matches', () => {
      expect(didntSendReason).toEqual('validationFailed');
    });

    test('Stats matches correctly', () => {
      expect(stats).toMatchObject({
        Program: { created: 1, updated: 0, errored: 0 },
        Survey: { created: 2, updated: 0, errored: 0 },
        ProgramDataElement: { created: 46, updated: 0, errored: 0 },
        SurveyScreenComponent: { created: 13, updated: 0, errored: 33 },
      });
    });
  });

  describe('Vitals survey', () => {
    it('Should detect if the mandatory vitals questions are missing', async () => {
      const { errors } = await doImport({
        file: 'vitals-missing-qs',
        dryRun: true,
      });
      expect(errors).toContainValidationError('Vitals', 0, 'Survey missing required questions');
    });

    it('Should refuse to import more than one vitals survey', async () => {
      const { Program, Survey } = ctx.store.models;
      const program = await Program.create(fake(Program));
      await Survey.create({
        ...fake(Survey),
        surveyType: SURVEY_TYPES.VITALS,
        programId: program.id,
      });

      const { errors } = await doImport({
        file: 'vitals-valid',
        dryRun: true,
      });
      expect(errors).toContainAnError('metadata', 0, 'Only one vitals survey');
    });

    it('Should reject a vitals survey with isSensitive set to true', async () => {
      const { errors } = await doImport({
        file: 'vitals-sensitive-true',
        dryRun: true,
      });
      expect(errors).toContainAnError('metadata', 0, 'Vitals survey can not be sensitive');
    });

    it('Should validate normalRange in validation_criteria', async () => {
      const { errors, stats } = await doImport({
        file: 'vitals-validate-normal-range-in-validation-criteria',
        dryRun: true,
      });

      const errorMessages = [
        'sheetName: Vitals, code: \'PatientVitalsSBP\', normalRange must be within graphRange, got normalRange: {"min":30,"max":120}, graphRange: {"min":40,"max":240}}',
        'sheetName: Vitals, code: \'PatientVitalsDBP\', normalRange must be within graphRange, got normalRange: {"min":60,"max":250}, graphRange: {"min":40,"max":240}}',
        "sheetName: Vitals, code: 'PatientVitalsHeartRate', validationCriteria must be specified if visualisationConfig is presented",
        "sheetName: Vitals, code: 'PatientVitalsRespiratoryRate', validationCriteria must have normalRange",
        'sheetName: Vitals, code: \'PatientVitalsTemperature\', normalRange must be within graphRange, got normalRange: {"min":120,"max":185,"ageUnit":"months","ageMin":0,"ageMax":3}, graphRange: {"min":33.5,"max":41.5}}', // Validate array type normalRange
      ];

      errors.forEach((error, i) => {
        expect(error.message).toEqual(errorMessages[i]);
      });

      expect(stats).toMatchObject({
        Program: { created: 1, updated: 0, errored: 0 },
        Survey: { created: 1, updated: 0, errored: 0 },
        ProgramDataElement: { created: 16, updated: 0, errored: errorMessages.length },
        SurveyScreenComponent: { created: 16, updated: 0, errored: 0 },
      });
    });

    it('Should import a valid vitals survey', async () => {
      const { errors, stats, didntSendReason } = await doImport({
        file: 'vitals-valid',
        dryRun: true,
      });
      expect(errors).toBeEmpty();
      expect(didntSendReason).toEqual('dryRun');
      expect(stats).toMatchObject({
        Program: { created: 1, updated: 0, errored: 0 },
        Survey: { created: 1, updated: 0, errored: 0 },
        ProgramDataElement: { created: 16, updated: 0, errored: 0 },
        SurveyScreenComponent: { created: 16, updated: 0, errored: 0 },
      });
    });

    it('Should import a valid vitals survey and delete visualisationConfig', async () => {
      const { ProgramDataElement } = ctx.store.models;

      const validateVisualisationConfig = async expectValue => {
        const { visualisationConfig } = await ProgramDataElement.findOne({
          where: {
            code: 'PatientVitalsHeartRate',
          },
        });
        expect(visualisationConfig).toEqual(expectValue);
      };

      await doImport({
        file: 'vitals-valid',
        dryRun: false,
      });
      await validateVisualisationConfig(
        '{"yAxis":{"graphRange":{"min":30,"max":300}, "interval":10}}',
      );

      await doImport({
        file: 'vitals-delete-visualisation-config',
        dryRun: false,
      });
      await validateVisualisationConfig('');
    });

    it('should soft delete vital survey questions', async () => {
      const { Survey, SurveyScreenComponent } = ctx.store.models;

      const getComponents = async () => {
        const survey = await Survey.findByPk('program-testvitals-vitalsgood');
        expect(survey).toBeTruthy();

        return SurveyScreenComponent.findAll({
          where: {
            surveyId: survey.id,
            visibilityStatus: 'current',
          },
        });
      };

      {
        const { errors, stats } = await doImport({ file: 'vitals-delete-questions' });
        expect(errors).toBeEmpty();
        expect(stats).toMatchObject({
          Program: { created: 1, updated: 0, errored: 0 },
          Survey: { created: 1, updated: 0, errored: 0 },
          ProgramDataElement: { created: 16, updated: 0, errored: 0 },
          SurveyScreenComponent: { created: 16, updated: 0, errored: 0 },
        });
      }

      // find imported ssc
      const componentsBefore = await getComponents();
      expect(componentsBefore).toHaveLength(16);

      {
        const { errors, stats } = await doImport({ file: 'vitals-delete-questions-2' });
        expect(errors).toBeEmpty();
        expect(stats).toMatchObject({
          ProgramDataElement: { skipped: 16 }, // deleter should NOT delete underlying PDEs
          SurveyScreenComponent: { skipped: 15, deleted: 1 },
        });
      }

      const componentsAfter = await getComponents();
      expect(componentsAfter).toHaveLength(15);
    });
  });

  describe('Program Registry', () => {
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

  describe('Charting', () => {
    describe('Simple chart', () => {
      it('Should import a valid simple chart survey', async () => {
        const { errors, stats, didntSendReason } = await doImport({
          file: 'charting-simple-valid',
          dryRun: true,
        });
        expect(errors).toBeEmpty();
        expect(didntSendReason).toEqual('dryRun');
        expect(stats).toMatchObject({
          Program: { created: 1, updated: 0, errored: 0 },
          Survey: { created: 1, updated: 0, errored: 0 },
          ProgramDataElement: { created: 4, updated: 0, errored: 0 },
          SurveyScreenComponent: { created: 4, updated: 0, errored: 0 },
        });
      });
      it('Should be able to import multiple simple chart surveys for the same program', async () => {
        const { errors, stats, didntSendReason } = await doImport({
          file: 'charting-simple-multiple-valid',
          dryRun: true,
        });
        expect(errors).toBeEmpty();
        expect(didntSendReason).toEqual('dryRun');
        expect(stats).toMatchObject({
          Program: { created: 1, updated: 0, errored: 0 },
          Survey: { created: 2, updated: 0, errored: 0 },
          ProgramDataElement: { created: 7, skipped: 1, errored: 0 },
          SurveyScreenComponent: { created: 8, updated: 0, errored: 0 },
        });
      });
      it('Should refuse to import a simple chart survey with isSensitive set to true', async () => {
        const { errors } = await doImport({
          file: 'charting-simple-sensitive-invalid',
          dryRun: true,
        });
        expect(errors).toContainAnError('metadata', 0, 'Charting survey can not be sensitive');
      });
      it('Should refuse to import a simple chart if the first question has wrong ID', async () => {
        const { errors } = await doImport({
          file: 'charting-simple-datetime-invalid-id',
          dryRun: true,
        });
        const expectedError =
          "sheetName: Test Chart, code: 'testchartcode0', First question should have 'pde-PatientChartingDate' as ID";
        expect(errors.length).toEqual(1);
        expect(errors[0].message).toEqual(expectedError);
      });
      it('Should refuse to import a simple chart if the first question is not DateTime type', async () => {
        const { errors } = await doImport({
          file: 'charting-simple-datetime-invalid-type',
          dryRun: true,
        });
        const expectedError =
          "sheetName: Test Chart, code: 'PatientChartingDate', First question should be DateTime type";
        expect(errors.length).toEqual(1);
        expect(errors[0].message).toEqual(expectedError);
      });
    });
    describe('Complex chart', () => {
      it('Should import a valid complex chart survey', async () => {
        const { errors, stats, didntSendReason } = await doImport({
          file: 'charting-complex-valid',
          dryRun: true,
        });
        expect(errors).toBeEmpty();
        expect(didntSendReason).toEqual('dryRun');
        expect(stats).toMatchObject({
          Program: { created: 1, updated: 0, errored: 0 },
          Survey: { created: 2, updated: 0, errored: 0 },
          ProgramDataElement: { created: 8, updated: 0, errored: 0 },
          SurveyScreenComponent: { created: 8, updated: 0, errored: 0 },
        });
      });
      it('Should refuse to import without its core info (ComplexChartCore)', async () => {
        const { errors } = await doImport({
          file: 'charting-complex-main-only-invalid',
          dryRun: true,
        });
        expect(errors).toContainAnError(
          'metadata',
          0,
          'Complex charts need a core data set survey',
        );
      });
      it('Should refuse to import without its main info (ComplexChart)', async () => {
        const { errors } = await doImport({
          file: 'charting-complex-core-only-invalid',
          dryRun: true,
        });
        expect(errors).toContainAnError(
          'metadata',
          0,
          'Cannot import a complex chart core without the main survey',
        );
      });
      it('Should refuse to import a complex core survey without special question config types', async () => {
        const { errors, stats } = await doImport({
          file: 'charting-complex-core-question-types-invalid',
          dryRun: true,
        });

        const errorMessages = [
          'Invalid complex chart core questions',
          "sheetName: Core, code: 'ComplexChartInstanceName', Invalid question type",
          "sheetName: Core, code: 'ComplexChartDate', Invalid question type",
          "sheetName: Core, code: 'ComplexChartType', Invalid question type",
          "sheetName: Core, code: 'ComplexChartSubtype', Invalid question type",
        ];

        errors.forEach((error, i) => {
          expect(error.message).toEqual(errorMessages[i]);
        });

        expect(stats).toMatchObject({
          Program: { created: 1, updated: 0, errored: 0 },
          Survey: { created: 2, updated: 0, errored: 0 },
          ProgramDataElement: { created: 8, updated: 0, errored: errorMessages.length },
          SurveyScreenComponent: { created: 8, updated: 0, errored: 0 },
        });
      });
      it('Should refuse to import a complex core survey without special question config IDs', async () => {
        const { errors, stats } = await doImport({
          file: 'charting-complex-core-question-ids-invalid',
          dryRun: true,
        });

        const errorMessages = [
          "sheetName: Core, code: 'testchartcorecode0', Invalid ID for question type",
          "sheetName: Core, code: 'testchartcorecode1', Invalid ID for question type",
          "sheetName: Core, code: 'testchartcorecode2', Invalid ID for question type",
          "sheetName: Core, code: 'testchartcorecode3', Invalid ID for question type",
        ];

        errors.forEach((error, i) => {
          expect(error.message).toEqual(errorMessages[i]);
        });

        expect(stats).toMatchObject({
          Program: { created: 1, updated: 0, errored: 0 },
          Survey: { created: 2, updated: 0, errored: 0 },
          ProgramDataElement: { created: 8, updated: 0, errored: errorMessages.length },
          SurveyScreenComponent: { created: 8, updated: 0, errored: 0 },
        });
      });
      it('Should only be able to hide "type" and "subtype" questions for complex core survey', async () => {
        const { errors, stats } = await doImport({
          file: 'charting-complex-core-hidden-question-invalid',
          dryRun: true,
        });

        const errorMessages = [
          "sheetName: Core, code: 'ComplexChartInstanceName', ComplexChartInstanceName cannot be hidden",
          "sheetName: Core, code: 'ComplexChartDate', ComplexChartDate cannot be hidden",
        ];

        errors.forEach((error, i) => {
          expect(error.message).toEqual(errorMessages[i]);
        });

        expect(stats).toMatchObject({
          Program: { created: 1, updated: 0, errored: 0 },
          Survey: { created: 2, updated: 0, errored: 0 },
          ProgramDataElement: { created: 8, updated: 0, errored: errorMessages.length },
          SurveyScreenComponent: { created: 8, updated: 0, errored: 0 },
        });
      });
      it('Should only be one complex chart and complex core per program', async () => {
        const { errors } = await doImport({
          file: 'charting-complex-multiple-invalid',
          dryRun: true,
        });
        expect(errors).toContainAnError(
          'metadata',
          0,
          'Only one complex chart and complex chart core allowed in a program',
        );
      });
      it('Should refuse to import a complex chart set if it already exists in that program', async () => {
        const { Program, Survey } = ctx.store.models;
        const program = await Program.create({
          ...fake(Program),
          id: 'program-testcomplexchart',
          code: 'testcomplexchart',
        });
        await Survey.create({
          ...fake(Survey),
          surveyType: SURVEY_TYPES.COMPLEX_CHART,
          programId: program.id,
        });
        await Survey.create({
          ...fake(Survey),
          surveyType: SURVEY_TYPES.COMPLEX_CHART_CORE,
          programId: program.id,
        });
        const { errors } = await doImport({
          file: 'charting-complex-valid',
          dryRun: true,
        });
        expect(errors).toContainAnError(
          'metadata',
          0,
          'Complex chart set already exists for this program',
        );
      });
      it('Should refuse to import a complex chart survey with isSensitive set to true', async () => {
        const { errors } = await doImport({
          file: 'charting-complex-sensitive-invalid',
          dryRun: true,
        });
        expect(errors).toContainAnError('metadata', 0, 'Charting survey can not be sensitive');
      });
      it('Should refuse to import a complex chart core survey with isSensitive set to true', async () => {
        const { errors } = await doImport({
          file: 'charting-complex-core-sensitive-invalid',
          dryRun: true,
        });
        expect(errors).toContainAnError('metadata', 0, 'Charting survey can not be sensitive');
      });
      it('Should refuse to import a complex chart if the first question has wrong ID', async () => {
        const { errors } = await doImport({
          file: 'charting-complex-datetime-invalid-id',
          dryRun: true,
        });
        const expectedError =
          "sheetName: Test Chart, code: 'testchartcode0', First question should have 'pde-PatientChartingDate' as ID";
        expect(errors.length).toEqual(1);
        expect(errors[0].message).toEqual(expectedError);
      });
      it('Should refuse to import a complex chart if the first question is not DateTime type', async () => {
        const { errors } = await doImport({
          file: 'charting-complex-datetime-invalid-type',
          dryRun: true,
        });
        const expectedError =
          "sheetName: Test Chart, code: 'PatientChartingDate', First question should be DateTime type";
        expect(errors.length).toEqual(1);
        expect(errors[0].message).toEqual(expectedError);
      });
      it('Should refuse to import a complex chart core without exactly 4 question types', async () => {
        const { errors } = await doImport({
          file: 'charting-complex-core-question-amount-invalid',
          dryRun: true,
        });
        const expectedError = 'Invalid complex chart core questions';
        expect(errors.length).toEqual(1);
        expect(errors[0].message).toEqual(expectedError);
      });
      it('Should refuse to import a complex chart core without specific order', async () => {
        const { errors } = await doImport({
          file: 'charting-complex-core-question-order-invalid',
          dryRun: true,
        });
        const expectedError = 'Invalid complex chart core questions';
        expect(errors.length).toEqual(1);
        expect(errors[0].message).toEqual(expectedError);
      });
    });
  });

  describe('Translation', () => {
    it('should create translations for the vitals survey', async () => {
      await doImport({
        file: 'vitals-valid',
        dryRun: false,
      });

      const translations = await models.TranslatedString.findAll();
      const generatedStringIds = translations.map(translation => translation.stringId);

      const programStringId = `${REFERENCE_DATA_TRANSLATION_PREFIX}.program.program-testvitals`;
      const surveyStringId = `${REFERENCE_DATA_TRANSLATION_PREFIX}.survey.program-testvitals-vitalsgood`;

      //check if the program and survey string ids are in the generated string ids
      expect(generatedStringIds).toContain(programStringId);
      expect(generatedStringIds).toContain(surveyStringId);

      // Check each data element has an appropriate string id
      const dataElements = await models.ProgramDataElement.findAll();
      dataElements.forEach(dataElement => {
        const stringId = `${REFERENCE_DATA_TRANSLATION_PREFIX}.programDataElement.${dataElement.id}`;
        expect(generatedStringIds).toContain(stringId);
      });
    });

    it('should translate nested options', async () => {
      await doImport({
        file: 'vitals-valid',
        dryRun: false,
      });

      // find an element with options
      const programDataElement = await models.ProgramDataElement.findOne({
        where: {
          defaultOptions: {
            [Op.ne]: null,
          },
        },
      });

      if (!programDataElement)
        throw new Error('No program data element with options found in vitals-valid.xlsx');

      const translations = await models.TranslatedString.findAll({
        where: { stringId: { [Op.like]: 'refData.programDataElement%' } },
      });
      const stringIds = translations.map(translation => translation.stringId);

      const expectedStringIds = normaliseOptions(programDataElement.defaultOptions).map(
        option =>
          getReferenceDataOptionStringId(programDataElement.id, 'programDataElement', option),
      );

      expect(stringIds).toEqual(expect.arrayContaining(expectedStringIds));
    });

    it('should translate text and detail fields for survey screen components', async () => {
      await doImport({
        file: 'valid',
        dryRun: false,
      });

      const surveyScreenComponents = await models.SurveyScreenComponent.findAll();
      let expectedStringIds = [];
      surveyScreenComponents.forEach(surveyScreenComponent => {
        if (surveyScreenComponent.text) {
          expectedStringIds.push(
            `${REFERENCE_DATA_TRANSLATION_PREFIX}.surveyScreenComponent.text.${surveyScreenComponent.id}`,
          );
        }
        if (surveyScreenComponent.detail) {
          expectedStringIds.push(
            `${REFERENCE_DATA_TRANSLATION_PREFIX}.surveyScreenComponent.detail.${surveyScreenComponent.id}`,
          );
        }
      });

      const translatedStrings = await models.TranslatedString.findAll({
        where: { stringId: { [Op.like]: 'refData.surveyScreenComponent%' } },
      });

      const generatedStringIds = translatedStrings.map(translation => translation.stringId);

      expect(generatedStringIds).toEqual(expect.arrayContaining(expectedStringIds));
    });
  });
});
