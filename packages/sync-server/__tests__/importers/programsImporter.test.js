import { fake } from '@tamanu/shared/test-helpers/fake';
import { findOneOrCreate } from '@tamanu/shared/test-helpers/factory';
import { SURVEY_TYPES } from '@tamanu/constants';
import { importerTransaction } from '../../app/admin/importerEndpoint';
import { programImporter } from '../../app/admin/programImporter';
import { createTestContext } from '../utilities';
import './matchers';

// the importer can take a little while
jest.setTimeout(300000);

describe('Programs import', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });

  const truncateTables = async () => {
    const {
      Program,
      Survey,
      PatientProgramRegistration,
      ProgramRegistry,
      ProgramRegistryClinicalStatus,
      ProgramDataElement,
      SurveyScreenComponent,
    } = ctx.store.models;
    await SurveyScreenComponent.destroy({ where: {}, force: true });
    await ProgramDataElement.destroy({ where: {}, force: true });
    await Survey.destroy({ where: {}, force: true });
    await Program.destroy({ where: {}, force: true });
    await PatientProgramRegistration.destroy({ where: {}, force: true });
    await ProgramRegistryClinicalStatus.destroy({ where: {}, force: true });
    await ProgramRegistry.destroy({ where: {}, force: true });
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
      ...opts,
    });
  }

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

  it('should delete survey questions', async () => {
    const { Survey } = ctx.store.models;

    const getComponents = async () => {
      const survey = await Survey.findByPk('program-testprogram-deletion');
      expect(survey).toBeTruthy();
      return survey.getComponents();
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
        ProgramDataElement: { updated: 3 }, // deleter should NOT delete underlying PDEs
        SurveyScreenComponent: { deleted: 2, updated: 1 },
      });
    }

    const componentsAfter = await getComponents();
    // of the three in the import doc:
    //  - one is not deleted
    //  - one is set to visibilityStatus = 'deleted'
    //  - one is set to visibilityStatus = 'hidden' (should delete as wel)
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

  it('run validation against question configs', async () => {
    const { didntSendReason, errors, stats } = await doImport({
      file: 'question-validation',
      xml: true,
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');
    const expectedErrorMessages = [
      'validationCriteria: this field has unspecified keys: foo on Question Validation Fail at row 4',
      'validationCriteria: mandatory must be a `boolean` type, but the final value was: `"true"`. on Question Validation Fail at row 5',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 6',
      'config: unit must be a `string` type, but the final value was: `true`. on Question Validation Fail at row 7',
      'validationCriteria: this field has unspecified keys: foo on Question Validation Fail at row 8',
      'validationCriteria: mandatory must be a `boolean` type, but the final value was: `"true"`. on Question Validation Fail at row 9',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 10',
      'config: unit must be a `string` type, but the final value was: `true`. on Question Validation Fail at row 11',
      'validationCriteria: this field has unspecified keys: foo on Question Validation Fail at row 12',
      'validationCriteria: mandatory must be a `boolean` type, but the final value was: `"true"`. on Question Validation Fail at row 13',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 14',
      'config: unit must be a `string` type, but the final value was: `true`. on Question Validation Fail at row 15',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 16',
      'config: column must be a `string` type, but the final value was: `24`. on Question Validation Fail at row 17',
      'config: writeToPatient.fieldName must be one of the following values: registrationClinicalStatus, programRegistrationStatus, registrationClinician, registeringFacility, registrationCurrentlyAtVillage, registrationCurrentlyAtFacility, firstName, middleName, lastName, culturalName, dateOfBirth, dateOfDeath, sex, email, villageId, placeOfBirth, bloodType, primaryContactNumber, secondaryContactNumber, maritalStatus, cityTown, streetVillage, educationalLevel, socialMedia, title, birthCertificate, drivingLicense, passport, emergencyContactName, emergencyContactNumber, registeredById, motherId, fatherId, nationalityId, countryId, divisionId, subdivisionId, medicalAreaId, nursingZoneId, settlementId, ethnicityId, occupationId, religionId, patientBillingTypeId, countryOfBirthId on Question Validation Fail at row 18',
      'config: writeToPatient.fieldType is a required field on Question Validation Fail at row 19',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 20',
      'config: column must be a `string` type, but the final value was: `24`. on Question Validation Fail at row 21',
      'config: column is a required field on Question Validation Fail at row 22',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 23',
      'config: source must be a `string` type, but the final value was: `true`. on Question Validation Fail at row 24',
      'config: where is a required field on Question Validation Fail at row 25',
      'config: source is a required field on Question Validation Fail at row 26',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 27',
      'config: source must be a `string` type, but the final value was: `true`. on Question Validation Fail at row 28',
      'config: source is a required field on Question Validation Fail at row 29',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 30',
      'config: source must be a `string` type, but the final value was: `true`. on Question Validation Fail at row 31',
      'config: source is a required field on Question Validation Fail at row 32',
      'config: this field has unspecified keys: foo on Question Validation Fail at row 33',
      'config: source must be a `string` type, but the final value was: `true`. on Question Validation Fail at row 34',
      'config: source is a required field on Question Validation Fail at row 35',
    ];

    errors.forEach((error, i) => {
      expect(error.message).toEqual(expectedErrorMessages[i]);
    });
    expect(stats).toMatchObject({
      Program: { created: 1, updated: 0, errored: 0 },
      Survey: { created: 2, updated: 0, errored: 0 },
      ProgramDataElement: { created: 41, updated: 0, errored: 0 },
      SurveyScreenComponent: { created: 9, updated: 0, errored: 32 }, // 32 fields in failure test, 9 in success test
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
      expect(errors).toContainValidationError('metadata', 0, 'Only one vitals survey');
    });

    it('Should reject a vitals survey with isSensitive set to true', async () => {
      const { errors } = await doImport({
        file: 'vitals-sensitive-true',
        dryRun: true,
      });
      expect(errors).toContainValidationError('metadata', 0, 'Vitals survey can not be sensitive');
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
        Program: { created: 0, updated: 1, errored: 0 },
        Survey: { created: 0, updated: 1, errored: 0 },
        ProgramRegistry: { created: 0, updated: 1, errored: 0 },
        ProgramRegistryClinicalStatus: { created: 1, updated: 3, errored: 0 },
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
      const { PatientProgramRegistration } = ctx.store.models;
      await doImport({
        file: 'registry-valid-village',
        xml: true,
        dryRun: false,
      });
      await findOneOrCreate(ctx.store.models, PatientProgramRegistration, {
        programRegistryId: 'programRegistry-ValidRegistry',
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
      const { PatientProgramRegistration } = ctx.store.models;
      await doImport({
        file: 'registry-valid-village',
        xml: true,
        dryRun: false,
      });
      const registration = await findOneOrCreate(ctx.store.models, PatientProgramRegistration, {
        programRegistryId: 'programRegistry-ValidRegistry',
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

    it('should validate survey patient data fieldType based on registry currentlyAtType', async () => {
      const { errors } = await doImport({
        file: 'registry-invalid-patient-data-q',
        xml: true,
        dryRun: false,
      });
      expect(errors).not.toBeEmpty();
    });
  });
});
