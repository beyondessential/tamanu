import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fake } from '@tamanu/fake-data/fake';
import { PATIENT_FIELD_DEFINITION_TYPES } from '@tamanu/constants/patientFields';
import { findOneOrCreate } from '@tamanu/fake-data/test-helpers';
import {
  PROGRAM_DATA_ELEMENT_TYPES,
  REGISTRATION_STATUSES,
  SURVEY_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { createTestContext } from '../utilities';

async function createDummySurvey(models) {
  const program = await models.Program.create(fake(models.Program));
  return models.Survey.create({
    ...fake(models.Program),
    surveyType: SURVEY_TYPES.PROGRAMS,
    programId: program.id,
  });
}

async function createDummyDataElement(models, survey, { config, ...dataElementOverrides }) {
  const dataElement = await models.ProgramDataElement.create({
    ...fake(models.ProgramDataElement),
    ...dataElementOverrides,
  });

  await models.SurveyScreenComponent.create({
    ...fake(models.SurveyScreenComponent),
    dataElementId: dataElement.id,
    surveyId: survey.id,
    config: JSON.stringify(config),
  });

  return { dataElement };
}

describe('SurveyResponse.createWithAnswers Patient Fields', () => {
  let ctx, models, patientId, encounterId, surveyId, dataElementId, patientFieldDefinitionId;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    const patient = await models.Patient.create(fake(models.Patient));
    const encounter = await findOneOrCreate(models, models.Encounter, {
      patientId: patient.id,
    });

    const { PatientFieldDefinitionCategory, PatientFieldDefinition } = models;
    const category = await PatientFieldDefinitionCategory.create(
      fake(PatientFieldDefinitionCategory),
    );
    const definition = await PatientFieldDefinition.create({
      id: 'customFatherNameField',
      categoryId: category.id,
      name: 'father',
      fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
    });
    const survey = await createDummySurvey(models);
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
      config: {
        column: definition.id,
        writeToPatient: {
          fieldName: definition.id,
          isCustomPatientField: true,
        },
      },
    });

    patientId = patient.id;
    encounterId = encounter.id;
    surveyId = survey.id;
    dataElementId = dataElement.id;
    patientFieldDefinitionId = definition.id;
  });

  afterEach(async () => {
    await models.SurveyResponse.truncate();
    await models.SurveyResponseAnswer.truncate();
    await models.ProgramRegistry.truncate();
    await models.ProgramRegistryClinicalStatus.truncate();
    await models.PatientProgramRegistration.truncate();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('writes to patient custom fields from actions', async () => {
    const { SurveyResponse, SurveyResponseAnswer, PatientFieldValue } = models;

    await SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: surveyId,
        answers: {
          [dataElementId]: 'alastair',
        },
      }),
    );

    expect(await SurveyResponse.findOne()).toMatchObject({
      surveyId: surveyId,
      encounterId,
      result: 0,
      resultText: '',
    });
    expect(await SurveyResponseAnswer.findOne()).toMatchObject({
      dataElementId: dataElementId,
      body: 'alastair',
    });

    expect(
      await PatientFieldValue.findOne({
        where: {
          definitionId: patientFieldDefinitionId,
          patientId,
        },
        order: [['updatedAt', 'DESC']],
      }),
    ).toMatchObject({
      value: 'alastair',
    });
  });

  it('edits patient custom fields from actions', async () => {
    const { SurveyResponse, PatientFieldValue } = models;

    await PatientFieldValue.findOrCreate({
      where: { patientId: patientId, definitionId: patientFieldDefinitionId },
      defaults: { value: 'john' },
    });

    await SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: surveyId,
        answers: {
          [dataElementId]: 'James Smith',
        },
      }),
    );

    expect(
      await PatientFieldValue.findOne({
        where: {
          definitionId: patientFieldDefinitionId,
          patientId,
        },
        order: [['updatedAt', 'DESC']],
      }),
    ).toMatchObject({
      value: 'James Smith',
    });
  });
});

describe('SurveyResponse.createWithAnswers', () => {
  let ctx;
  let models;
  let patientId;
  let encounterId;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    const patient = await models.Patient.create(fake(models.Patient));
    const encounter = await findOneOrCreate(models, models.Encounter, {
      patientId: patient.id,
    });
    patientId = patient.id;
    encounterId = encounter.id;
  });

  afterEach(async () => {
    await models.SurveyResponse.truncate();
    await models.SurveyResponseAnswer.truncate();
    await models.ProgramRegistry.truncate();
    await models.ProgramRegistryClinicalStatus.truncate();
    await models.PatientProgramRegistration.truncate();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('should error if not run in a transaction', async () => {
    const survey = await createDummySurvey(models);
    const dataElement = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.NUMBER,
    });

    await expect(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: survey.id,
        answers: {
          [dataElement.id]: 12,
        },
      }),
    ).rejects.toThrow('SurveyResponse.createWithAnswers must always run inside a transaction!');
  });

  it('creates a surveyResponse and basic answer', async () => {
    const survey = await createDummySurvey(models);
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.NUMBER,
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: survey.id,
        answers: {
          [dataElement.id]: 12,
        },
      }),
    );

    expect(await models.SurveyResponse.findOne()).toMatchObject({
      surveyId: survey.id,
      encounterId,
      result: 0,
      resultText: '',
    });
    expect(await models.SurveyResponseAnswer.findOne()).toMatchObject({
      dataElementId: dataElement.id,
      body: '12',
    });
  });

  it('computes result from calculated answers when the client does not precompute them', async () => {
    const survey = await createDummySurvey(models);
    const numberElement = await models.ProgramDataElement.create({
      ...fake(models.ProgramDataElement),
      code: 'testNumber',
      type: PROGRAM_DATA_ELEMENT_TYPES.NUMBER,
    });
    await models.SurveyScreenComponent.create({
      ...fake(models.SurveyScreenComponent),
      dataElementId: numberElement.id,
      surveyId: survey.id,
    });
    const resultElement = await models.ProgramDataElement.create({
      ...fake(models.ProgramDataElement),
      code: 'testResult',
      type: PROGRAM_DATA_ELEMENT_TYPES.RESULT,
    });
    await models.SurveyScreenComponent.create({
      ...fake(models.SurveyScreenComponent),
      dataElementId: resultElement.id,
      surveyId: survey.id,
      calculation: 'testNumber * 2',
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: survey.id,
        answers: {
          [numberElement.id]: 40,
        },
      }),
    );

    expect(await models.SurveyResponse.findOne()).toMatchObject({
      surveyId: survey.id,
      encounterId,
      result: 80,
      resultText: '80%',
    });
  });

  it('creates patient data from actions', async () => {
    const survey = await createDummySurvey(models);
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
      config: {
        writeToPatient: {
          fieldName: 'email',
        },
      },
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: survey.id,
        answers: {
          [dataElement.id]: 'alastair@bes.au',
        },
      }),
    );

    expect(await models.SurveyResponse.findOne()).toMatchObject({
      surveyId: survey.id,
      encounterId,
      result: 0,
      resultText: '',
    });
    expect(await models.SurveyResponseAnswer.findOne()).toMatchObject({
      dataElementId: dataElement.id,
      body: 'alastair@bes.au',
    });
    expect(await models.Patient.findByPk(patientId)).toMatchObject({
      email: 'alastair@bes.au',
    });
  });

  it("writes a captured photo to the patient's profile photo", async () => {
    const survey = await createDummySurvey(models);
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PHOTO,
      config: {
        writeToPatient: {
          fieldName: 'profilePhoto',
        },
      },
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: survey.id,
        answers: {
          // a photo answer supplied as an attachment id is stored as-is
          [dataElement.id]: 'an-existing-attachment-id',
        },
      }),
    );

    const additionalData = await models.PatientAdditionalData.getForPatient(patientId);
    expect(additionalData.profilePhotoAttachmentId).toBe('an-existing-attachment-id');
  });

  it('stores the id of the attachment it created, not the raw image', async () => {
    const survey = await createDummySurvey(models);
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PHOTO,
      config: {
        writeToPatient: {
          fieldName: 'profilePhoto',
        },
      },
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: survey.id,
        answers: {
          [dataElement.id]: { size: 4, data: Buffer.from('test').toString('base64') },
        },
      }),
    );

    const answer = await models.SurveyResponseAnswer.findOne({
      where: { dataElementId: dataElement.id },
    });
    const additionalData = await models.PatientAdditionalData.getForPatient(patientId);

    expect(additionalData.profilePhotoAttachmentId).toBe(answer.body);
    expect(await models.Attachment.findByPk(answer.body)).not.toBeNull();
  });

  it('leaves an existing photo alone when the photo question is left unanswered', async () => {
    const otherPatient = await models.Patient.create(fake(models.Patient));
    const otherEncounter = await findOneOrCreate(models, models.Encounter, {
      patientId: otherPatient.id,
    });
    await models.PatientAdditionalData.updateForPatient(otherPatient.id, {
      profilePhotoAttachmentId: 'a-photo-set-from-the-sidebar',
    });

    const survey = await createDummySurvey(models);
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PHOTO,
      config: {
        writeToPatient: {
          fieldName: 'profilePhoto',
        },
      },
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId: otherPatient.id,
        encounterId: otherEncounter.id,
        surveyId: survey.id,
        answers: {
          // the clinician skipped the photo question, or cleared the one they took
          [dataElement.id]: null,
        },
      }),
    );

    const additionalData = await models.PatientAdditionalData.getForPatient(otherPatient.id);
    expect(additionalData.profilePhotoAttachmentId).toBe('a-photo-set-from-the-sidebar');
  });

  it('undoes an earlier removal when a survey captures a new photo', async () => {
    const otherPatient = await models.Patient.create(fake(models.Patient));
    const otherEncounter = await findOneOrCreate(models, models.Encounter, {
      patientId: otherPatient.id,
    });
    await models.PatientAdditionalData.updateForPatient(otherPatient.id, {
      profilePhotoRemoved: true,
    });

    const survey = await createDummySurvey(models);
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PHOTO,
      config: {
        writeToPatient: {
          fieldName: 'profilePhoto',
        },
      },
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId: otherPatient.id,
        encounterId: otherEncounter.id,
        surveyId: survey.id,
        answers: {
          [dataElement.id]: 'a-freshly-captured-photo',
        },
      }),
    );

    const additionalData = await models.PatientAdditionalData.getForPatient(otherPatient.id);
    expect(additionalData.profilePhotoAttachmentId).toBe('a-freshly-captured-photo');
    expect(additionalData.profilePhotoRemoved).toBe(false);
  });

  it('leaves the patient alone for a photo question that does not write to them', async () => {
    // a patient of its own: the shared one carries a photo from the tests above, and patient
    // additional data isn't truncated between them
    const otherPatient = await models.Patient.create(fake(models.Patient));
    const otherEncounter = await findOneOrCreate(models, models.Encounter, {
      patientId: otherPatient.id,
    });
    const survey = await createDummySurvey(models);
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PHOTO,
      config: undefined,
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId: otherPatient.id,
        encounterId: otherEncounter.id,
        surveyId: survey.id,
        answers: {
          [dataElement.id]: 'an-ordinary-photo-attachment',
        },
      }),
    );

    const additionalData = await models.PatientAdditionalData.getForPatient(otherPatient.id);
    expect(additionalData?.profilePhotoAttachmentId ?? null).toBeNull();
  });

  it('creates patient program registration from actions', async () => {
    const survey = await createDummySurvey(models);
    const registry = await models.ProgramRegistry.create(
      fake(models.ProgramRegistry, {
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        programId: survey.programId,
      }),
    );
    const clinicalStatus = await models.ProgramRegistryClinicalStatus.create(
      fake(models.ProgramRegistryClinicalStatus, {
        programRegistryId: registry.id,
      }),
    );
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
      config: {
        writeToPatient: {
          fieldName: 'registrationClinicalStatus',
        },
      },
    });
    const { id: userId } = await models.User.create({
      displayName: 'Test clinician',
      email: 'testclinician@test.test',
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        userId,
        surveyId: survey.id,
        answers: {
          [dataElement.id]: clinicalStatus.id,
        },
      }),
    );

    expect(await models.PatientProgramRegistration.findOne()).toMatchObject({
      patientId,
      clinicalStatusId: clinicalStatus.id,
      programRegistryId: registry.id,
      registrationStatus: REGISTRATION_STATUSES.ACTIVE,
    });
  });

  it('sets registration date to endTime on new registration', async () => {
    const survey = await createDummySurvey(models);
    const registry = await models.ProgramRegistry.create(
      fake(models.ProgramRegistry, {
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        programId: survey.programId,
      }),
    );
    const clinicalStatus = await models.ProgramRegistryClinicalStatus.create(
      fake(models.ProgramRegistryClinicalStatus, {
        programRegistryId: registry.id,
      }),
    );
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
      config: {
        writeToPatient: {
          fieldName: 'registrationClinicalStatus',
        },
      },
    });
    const { id: userId } = await models.User.create({
      displayName: 'Test clinician',
      email: 'testclinician-date@test.test',
    });

    const submittedEndTime = '2024-01-15 10:30:00';

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        userId,
        surveyId: survey.id,
        endTime: submittedEndTime,
        answers: {
          [dataElement.id]: clinicalStatus.id,
        },
      }),
    );

    const registration = await models.PatientProgramRegistration.findOne();
    expect(registration.date).toBe(submittedEndTime);
  });

  it('does not overwrite registration date on subsequent survey submission', async () => {
    const survey = await createDummySurvey(models);
    const registry = await models.ProgramRegistry.create(
      fake(models.ProgramRegistry, {
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        programId: survey.programId,
      }),
    );
    const clinicalStatus1 = await models.ProgramRegistryClinicalStatus.create(
      fake(models.ProgramRegistryClinicalStatus, {
        programRegistryId: registry.id,
      }),
    );
    const clinicalStatus2 = await models.ProgramRegistryClinicalStatus.create(
      fake(models.ProgramRegistryClinicalStatus, {
        programRegistryId: registry.id,
      }),
    );
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
      config: {
        writeToPatient: {
          fieldName: 'registrationClinicalStatus',
        },
      },
    });
    const { id: userId } = await models.User.create({
      displayName: 'Test clinician',
      email: 'testclinician-noupdate@test.test',
    });

    const originalEndTime = '2024-01-15 10:30:00';

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        userId,
        surveyId: survey.id,
        endTime: originalEndTime,
        answers: {
          [dataElement.id]: clinicalStatus1.id,
        },
      }),
    );

    const registrationAfterCreate = await models.PatientProgramRegistration.findOne();
    expect(registrationAfterCreate.date).toBe(originalEndTime);
    expect(registrationAfterCreate.clinicalStatusId).toBe(clinicalStatus1.id);

    const laterEndTime = '2024-06-01 14:00:00';

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        userId,
        surveyId: survey.id,
        endTime: laterEndTime,
        answers: {
          [dataElement.id]: clinicalStatus2.id,
        },
      }),
    );

    const registrationAfterUpdate = await models.PatientProgramRegistration.findOne();
    expect(registrationAfterUpdate.clinicalStatusId).toBe(clinicalStatus2.id);
    expect(registrationAfterUpdate.date).toBe(originalEndTime);
  });
});
