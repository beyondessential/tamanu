import { createDummyEncounter, createDummyPatient } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';
import { uploadAttachment } from '../../app/utils/uploadAttachment';

describe('PatientDocumentMetadata', () => {
  let baseApp;
  let models;
  let app;
  let patient;
  let encounterOne;
  let encounterTwo;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
    encounterOne = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    encounterTwo = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
  });

  it('should get a list of all documents from a patient', async () => {
    // Create five document metadata objects: two associated with the patient, two associated with
    // two different encounters for that patient and one without patient nor encounter.
    const metadataOne = {
      name: 'one',
      type: 'application/pdf',
      attachmentId: 'fake-id-1',
      patientId: patient.id,
    };
    const metadataTwo = {
      name: 'two',
      type: 'application/pdf',
      attachmentId: 'fake-id-2',
      patientId: patient.id,
    };
    const metadataThree = {
      name: 'three',
      type: 'application/pdf',
      attachmentId: 'fake-id-3',
      encounterId: encounterOne.id,
    };
    const metadataFour = {
      name: 'four',
      type: 'application/pdf',
      attachmentId: 'fake-id-4',
      encounterId: encounterTwo.id,
    };
    const metadataFive = { name: 'five', type: 'application/pdf', attachmentId: 'fake-id-5' };

    await Promise.all([
      models.DocumentMetadata.create(metadataOne),
      models.DocumentMetadata.create(metadataTwo),
      models.DocumentMetadata.create(metadataThree),
      models.DocumentMetadata.create(metadataFour),
      models.DocumentMetadata.create(metadataFive),
    ]);

    const result = await app.get(`/v1/patient/${patient.id}/documentMetadata`);
    expect(result).toHaveSucceeded();
    expect(result.body).toMatchObject({
      count: 4,
      data: expect.any(Array),
    });
  });

  it('should fail creating a document metadata if the patient ID does not exist', async () => {
    const result = await app.post('/v1/patient/123456789/documentMetadata').send({
      name: 'test document',
      type: 'application/pdf',
      documentOwner: 'someone',
      note: 'some note',
    });
    expect(result).toHaveRequestError();
  });

  it('should create a document metadata', async () => {
    // Mock function gets called inside api route
    uploadAttachment.mockImplementationOnce(req => {
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
    expect(uploadAttachment.mock.calls.length).toBe(1);
  });
});
