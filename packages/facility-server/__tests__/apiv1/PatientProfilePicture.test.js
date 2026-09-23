import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { CentralServerConnection } from '../../app/sync';
import { uploadAttachment } from '../../app/utils/uploadAttachment';
import { createTestContext } from '../utilities';

// The image lives on the central server, which is stubbed for every facility suite, so the
// fetch has to be given a body for the route to serve a photo at all. The type is deliberately
// not the route's own default, so a test asserting on it proves the value came from central.
const STUB_IMAGE = { data: 'aW1hZ2U=', type: 'image/png' };

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

  let centralFetch;
  beforeEach(() => {
    vi.clearAllMocks();
    centralFetch = vi.fn(async () => STUB_IMAGE);
    CentralServerConnection.mockImplementation(function () {
      return { fetch: centralFetch };
    });
  });

  it('should retrieve a profile picture where one exists', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    await uploadDummyProfilePicture(models, patient.id);

    const result = await app.get(`/api/patient/${patient.id}/profilePicture`);
    expect(result).toHaveSucceeded();

    expect(result.body).toEqual({ mimeType: STUB_IMAGE.type, data: STUB_IMAGE.data });
  });

  it("falls back to jpeg when the central server doesn't report the image's type", async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    await models.PatientAdditionalData.updateForPatient(patient.id, {
      profilePhotoAttachmentId: 'a-typeless-photo',
    });
    centralFetch.mockImplementationOnce(async () => ({ data: STUB_IMAGE.data }));

    const result = await app.get(`/api/patient/${patient.id}/profilePicture`);
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual({ mimeType: 'image/jpeg', data: STUB_IMAGE.data });
  });

  it('should send a placeholder picture when no real one is available', async () => {
    const otherPatient = await models.Patient.create(await createDummyPatient(models));

    const result = await app.get(`/api/patient/${otherPatient.id}/profilePicture`);
    expect(result).toHaveRequestError();
  });

  it('falls back to an older survey photo for a patient with none on their record', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    await uploadDummyProfilePicture(models, patient.id);

    const result = await app.get(`/api/patient/${patient.id}/profilePicture`);
    expect(result).toHaveSucceeded();

    // the dummy survey answer's body is the attachment id it should have gone looking for
    expect(centralFetch).toHaveBeenCalledWith(
      expect.stringContaining('attachment/12345'),
      expect.anything(),
    );
  });

  it('prefers the photo on the record over an earlier survey photo', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    await uploadDummyProfilePicture(models, patient.id);
    await models.PatientAdditionalData.updateForPatient(patient.id, {
      profilePhotoAttachmentId: 'the-record-photo',
    });

    const result = await app.get(`/api/patient/${patient.id}/profilePicture`);
    expect(result).toHaveSucceeded();

    expect(centralFetch).toHaveBeenCalledWith(
      expect.stringContaining('attachment/the-record-photo'),
      expect.anything(),
    );
  });

  it('reports no picture once the photo is removed, even when an older survey photo exists', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    await uploadDummyProfilePicture(models, patient.id);

    const removal = await app.delete(`/api/patient/${patient.id}/profilePicture`);
    expect(removal).toHaveSucceeded();

    const result = await app.get(`/api/patient/${patient.id}/profilePicture`);
    expect(result).toHaveStatus(404);
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
      expect(additionalData.profilePhotoRemoved).toBe(true);
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
    it('stores the uploaded image against the patient', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      uploadAttachment.mockImplementationOnce(() => ({ attachmentId: 'a-new-photo' }));

      const result = await app.post(`/api/patient/${patient.id}/profilePicture`);
      expect(result).toHaveSucceeded();
      expect(result.body).toEqual({ attachmentId: 'a-new-photo' });

      const additionalData = await models.PatientAdditionalData.getForPatient(patient.id);
      expect(additionalData.profilePhotoAttachmentId).toBe('a-new-photo');
    });

    it('undoes an earlier removal, so the new photo is shown', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      await models.PatientAdditionalData.updateForPatient(patient.id, {
        profilePhotoRemoved: true,
      });
      uploadAttachment.mockImplementationOnce(() => ({ attachmentId: 'a-replacement-photo' }));

      const result = await app.post(`/api/patient/${patient.id}/profilePicture`);
      expect(result).toHaveSucceeded();

      const additionalData = await models.PatientAdditionalData.getForPatient(patient.id);
      expect(additionalData.profilePhotoRemoved).toBe(false);
      expect(additionalData.profilePhotoAttachmentId).toBe('a-replacement-photo');
    });

    it('reports not found for a patient that does not exist, without uploading', async () => {
      const result = await app.post('/api/patient/not-a-real-patient/profilePicture');
      expect(result).toHaveRequestError();
      expect(uploadAttachment).not.toHaveBeenCalled();
    });

    it('is refused to a user without permission to write the patient', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const noPermsApp = await baseApp.asRole('base');

      const result = await noPermsApp.post(`/api/patient/${patient.id}/profilePicture`);
      expect(result).toBeForbidden();
      expect(uploadAttachment).not.toHaveBeenCalled();
    });
  });

  describe('authentication', () => {
    it('refuses an unauthenticated request to read a photo', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const result = await baseApp.get(`/api/patient/${patient.id}/profilePicture`);
      expect(result).toHaveRequestError();
    });

    it('refuses an unauthenticated request to set a photo', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const result = await baseApp.post(`/api/patient/${patient.id}/profilePicture`);
      expect(result).toHaveRequestError();
      expect(uploadAttachment).not.toHaveBeenCalled();
    });

    it('refuses an unauthenticated request to remove a photo', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      await models.PatientAdditionalData.updateForPatient(patient.id, {
        profilePhotoAttachmentId: 'a-photo-that-should-survive',
      });

      const result = await baseApp.delete(`/api/patient/${patient.id}/profilePicture`);
      expect(result).toHaveRequestError();

      const additionalData = await models.PatientAdditionalData.getForPatient(patient.id);
      expect(additionalData.profilePhotoAttachmentId).toBe('a-photo-that-should-survive');
    });
  });
});
