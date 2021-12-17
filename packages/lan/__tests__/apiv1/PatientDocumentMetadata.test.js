import { createDummyPatient } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';
import { uploadAttachment } from '../../app/utils/uploadAttachment';

describe('PatientDocumentMetadata', () => {
  let baseApp;
  let models;
  let app;
  let patient;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
  });

  it('should get a list of all documents from a patient', async () => {
    // TODO: create two document metadata objects linked to an encounter, one for this
    // patient, one for another patient. This will make the expected count be 3

    // Create three document metadata objects, two for this patient and one without patient
    const metadataOne = {
      name: 'one',
      type: 'application/pdf',
      attachmentId: 'fake-id-1',
      patientId: patient.id
    };
    const metadataTwo = {
      name: 'two',
      type: 'application/pdf',
      attachmentId: 'fake-id-2',
      patientId: patient.id
    };
    const metadataThree = { name: 'three', type: 'application/pdf', attachmentId: 'fake-id-3' };

    await Promise.all([
      models.DocumentMetadata.create(metadataOne),
      models.DocumentMetadata.create(metadataTwo),
      models.DocumentMetadata.create(metadataThree),
    ]);

    const result = await app.get(`/v1/patient/${patient.id}/documentMetadata`);
    expect(result).toHaveSucceeded();
    expect(result.body).toMatchObject({
      count: 2,
      data: expect.any(Array),
    });
  });

  it('should create a document', async () => {
    // Mock function gets called inside api route
    uploadAttachment.mockImplementationOnce((req, maxFileSize) => {
      // TODO: only mock remote.fetch, will need to actually send a multipart/form-data
      // request to the api point to work or also mock the getUploadedData function.
      return { metadata: { ...req.body }, attachmentId: '123456789' };
    });

    const result = await app.post(`/v1/patient/${patient.id}/documentMetadata`).send({
      name: 'test document',
      type: 'application/pdf',
      documentOwner: 'someone',
      note: 'some note',
    });
    expect(result).toHaveSucceeded();
    expect(result.body.id).toBeTruthy();
    const metadata = await models.DocumentMetadata.findByPk(result.body.id);
    expect(metadata).toBeDefined();
  });
});
