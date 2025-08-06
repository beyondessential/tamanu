import { importerTransaction } from '../../dist/admin/importer/importerEndpoint';
import { programImporter } from '../../dist/admin/programImporter';
import { createTestContext } from '../utilities';
import './matchers';

// the importer can take a little while
jest.setTimeout(60000);

describe('Programs import - Question Validation', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });

  beforeEach(async () => {
    const {
      Program,
      Survey,
      ProgramDataElement,
      SurveyScreenComponent,
    } = ctx.store.models;
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
