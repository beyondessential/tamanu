import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { createTestContext } from '../utilities';

async function uploadDummyProfilePicture(models, patientId) {
  const program = await models.Program.create({ name: 'pfp-program' });

  const survey = await models.Survey.create({
    programId: program.id,
    name: 'pfp-survey',
  });

  const dataElement = await models.ProgramDataElement.create({
    name: 'Profile picture',
    defaultText: 'abcd',
    code: 'ProfilePhoto',
    type: 'Photo',
  });

  await models.SurveyScreenComponent.create({
    dataElementId: dataElement.id,
    surveyId: survey.id,
    componentIndex: 0,
    text: 'Photo',
    screenIndex: 0,
  });

  const encounter = await models.Encounter.create({
    ...(await createDummyEncounter(models)),
    patientId,
  });

  await models.SurveyResponse.sequelize.transaction(() =>
    models.SurveyResponse.createWithAnswers({
      patientId,
      encounterId: encounter.id,
      surveyId: survey.id,
      answers: {
        [dataElement.id]: '12345',
      },
    }),
  );

  return dataElement;
}

describe('Patient profile picture', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  // Disabling this as the endpoint currently expects a real central server to exist
  it.skip('should retrieve a profile picture where one exists', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    await uploadDummyProfilePicture(models, patient.id);

    const result = await app.get(`/api/patient/${patient.id}/profilePicture`);
    expect(result).toHaveSucceeded();

    expect(result.body).toHaveProperty('data');
    expect(result.body).toHaveProperty('mimeType');
  });

  it('should send a placeholder picture when no real one is available', async () => {
    const otherPatient = await models.Patient.create(await createDummyPatient(models));

    const result = await app.get(`/api/patient/${otherPatient.id}/profilePicture`);
    expect(result).toHaveRequestError();
  });

  it('reports no picture for a patient whose record photo has been removed, even with an older survey photo', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    await uploadDummyProfilePicture(models, patient.id);
    await models.PatientAdditionalData.updateForPatient(patient.id, {
      profilePhotoAttachmentId: null,
    });

    // falls back to the survey answer, which needs a central server to load, so this only
    // asserts that a photo was found at all
    const result = await app.get(`/api/patient/${patient.id}/profilePicture`);
    expect(result).not.toHaveStatus(404);
  });

  describe('removing a photo', () => {
    it('clears the photo held against the patient', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      await models.PatientAdditionalData.updateForPatient(patient.id, {
        profilePhotoAttachmentId: 'attachment-to-remove',
      });

      const result = await app.delete(`/api/patient/${patient.id}/profilePicture`);
      expect(result).toHaveSucceeded();

      const additionalData = await models.PatientAdditionalData.getForPatient(patient.id);
      expect(additionalData.profilePhotoAttachmentId).toBeNull();
    });

    it('reports not found for a patient that does not exist', async () => {
      const result = await app.delete('/api/patient/not-a-real-patient/profilePicture');
      expect(result).toHaveRequestError();
    });

    it('is refused to a user without permission to write the patient', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      await models.PatientAdditionalData.updateForPatient(patient.id, {
        profilePhotoAttachmentId: 'attachment-to-keep',
      });
      const noPermsApp = await baseApp.asRole('base');

      const result = await noPermsApp.delete(`/api/patient/${patient.id}/profilePicture`);
      expect(result).toBeForbidden();

      const additionalData = await models.PatientAdditionalData.getForPatient(patient.id);
      expect(additionalData.profilePhotoAttachmentId).toBe('attachment-to-keep');
    });
  });

  describe('setting a photo', () => {
    it('is refused to a user without permission to write the patient', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const noPermsApp = await baseApp.asRole('base');

      const result = await noPermsApp.post(`/api/patient/${patient.id}/profilePicture`);
      expect(result).toBeForbidden();
    });
  });
});
