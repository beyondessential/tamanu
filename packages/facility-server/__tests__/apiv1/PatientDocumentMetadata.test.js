import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { DOCUMENT_SOURCES } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { uploadAttachment } from '../../app/utils/uploadAttachment';

describe('PatientDocumentMetadata', () => {
  let baseApp;
  let models;
  let app;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  it('should get a list of all documents from a patient', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    const encounterOne = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    const encounterTwo = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });

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

    const result = await app.get(`/api/patient/${patient.id}/documentMetadata`);
    expect(result).toHaveSucceeded();
    expect(result.body).toMatchObject({
      count: 4,
      data: expect.any(Array),
    });
  });

  it('should get a sorted list of documents', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });

    const metadataOne = await models.DocumentMetadata.create({
      name: 'A',
      type: 'application/pdf',
      source: DOCUMENT_SOURCES.UPLOADED,
      attachmentId: 'fake-id-1',
      patientId: patient.id,
    });
    const metadataTwo = await models.DocumentMetadata.create({
      name: 'B',
      type: 'image/jpeg',
      source: DOCUMENT_SOURCES.UPLOADED,
      attachmentId: 'fake-id-2',
      encounterId: encounter.id,
    });

    // Sort by name ASC/DESC (presumably sufficient to test only one field)
    const resultAsc = await app.get(
      `/api/patient/${patient.id}/documentMetadata?order=asc&orderBy=name`,
    );
    expect(resultAsc).toHaveSucceeded();
    expect(resultAsc.body.data[0].id).toBe(metadataOne.id);

    const resultDesc = await app.get(
      `/api/patient/${patient.id}/documentMetadata?order=desc&orderBy=name`,
    );
    expect(resultDesc).toHaveSucceeded();
    expect(resultDesc.body.count).toBe(2);
    expect(resultDesc.body.data[0].id).toBe(metadataTwo.id);
  });

  it('should get a paginated list of documents', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    const documents = [];
    for (let i = 0; i < 12; i++) {
      documents.push({
        name: String(i),
        type: 'application/pdf',
        attachmentId: `fake-id-${i}`,
        patientId: patient.id,
      });
    }
    await models.DocumentMetadata.bulkCreate(documents);
    const result = await app.get(
      `/api/patient/${patient.id}/documentMetadata?page=1&rowsPerPage=10&offset=5`,
    );
    expect(result).toHaveSucceeded();
    expect(result.body.count).toBe(12);
    expect(result.body.data.length).toBe(7);
  });

  it('should get a list of documents filtered by type', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));

    await models.DocumentMetadata.bulkCreate([
      { name: 'A', type: 'application/pdf', attachmentId: 'fake-id-1', patientId: patient.id },
      { name: 'B', type: 'application/pdf', attachmentId: 'fake-id-2', patientId: patient.id },
      { name: 'C', type: 'image/jpeg', attachmentId: 'fake-id-3', patientId: patient.id },
    ]);

    const result = await app.get(`/api/patient/${patient.id}/documentMetadata?type=pdf`);
    expect(result).toHaveSucceeded();
    expect(result.body.count).toBe(2);
  });

  it('should get a list of documents filtered by document owner', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));

    await models.DocumentMetadata.bulkCreate([
      {
        name: 'A',
        type: 'application/pdf',
        source: DOCUMENT_SOURCES.UPLOADED,
        documentOwner: 'ownerA',
        attachmentId: 'fake-id-1',
        patientId: patient.id,
      },
      {
        name: 'B',
        type: 'image/jpeg',
        source: DOCUMENT_SOURCES.UPLOADED,
        documentOwner: 'ownerA',
        attachmentId: 'fake-id-2',
        patientId: patient.id,
      },
      {
        name: 'C',
        type: 'image/jpeg',
        source: DOCUMENT_SOURCES.UPLOADED,
        documentOwner: 'ownerB',
        attachmentId: 'fake-id-3',
        patientId: patient.id,
      },
    ]);

    const result = await app.get(
      `/api/patient/${patient.id}/documentMetadata?documentOwner=ownerA`,
    );
    expect(result).toHaveSucceeded();
    expect(result.body.count).toBe(2);
  });

  it('should get a list of documents filtered by department id', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    const department = await models.Department.findOne();

    await models.DocumentMetadata.bulkCreate([
      {
        name: 'A',
        type: 'application/pdf',
        departmentId: department.id,
        attachmentId: 'fake-id-1',
        patientId: patient.id,
      },
      {
        name: 'B',
        type: 'application/pdf',
        departmentId: department.id,
        attachmentId: 'fake-id-2',
        patientId: patient.id,
      },
      {
        name: 'C',
        type: 'image/jpeg',
        attachmentId: 'fake-id-3',
        patientId: patient.id,
      },
    ]);

    const result = await app.get(
      `/api/patient/${patient.id}/documentMetadata?departmentId=${department.id}`,
    );
    expect(result).toHaveSucceeded();
    expect(result.body.count).toBe(2);
  });

  it('should get a list of documents with combined filters', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    const department = await models.Department.findOne();

    await models.DocumentMetadata.bulkCreate([
      {
        name: 'A',
        type: 'application/pdf',
        documentOwner: 'ownerA',
        departmentId: department.id,
        attachmentId: 'fake-id-1',
        patientId: patient.id,
      },
      {
        name: 'B',
        type: 'application/pdf',
        documentOwner: 'ownerB',
        departmentId: department.id,
        attachmentId: 'fake-id-2',
        patientId: patient.id,
      },
      {
        name: 'C',
        type: 'application/pdf',
        documentOwner: 'ownerB',
        attachmentId: 'fake-id-3',
        patientId: patient.id,
      },
      {
        name: 'D',
        type: 'image/jpeg',
        documentOwner: 'ownerB',
        attachmentId: 'fake-id-4',
        patientId: patient.id,
      },
    ]);

    const result = await app.get(
      `/api/patient/${patient.id}/documentMetadata?departmentId=${department.id}&type=pdf&documentOwner=ownerB`,
    );
    expect(result).toHaveSucceeded();
    expect(result.body.count).toBe(1);
  });

  it('should fail creating a document metadata if the patient ID does not exist', async () => {
    const result = await app.post('/api/patient/123456789/documentMetadata').send({
      name: 'test document',
      documentOwner: 'someone',
      note: 'some note',
    });
    expect(result).toHaveRequestError();
  });

  it('should create a document metadata', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));

    // Mock function gets called inside api route
    uploadAttachment.mockImplementationOnce((req) => ({
      metadata: { ...req.body },
      type: 'application/pdf',
      attachmentId: '123456789',
    }));

    const result = await app.post(`/api/patient/${patient.id}/documentMetadata`).send({
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

  describe('repeat submissions', () => {
    // A double-clicked Add button sends the same upload twice (card X4). Each arrives as
    // its own request, so the document must be deduplicated server-side.
    const documentPayload = {
      name: 'duplicated document',
      type: 'application/pdf',
      documentOwner: 'someone',
      documentCreatedAt: '2026-08-17 09:00:00',
    };

    const mockUpload = () =>
      uploadAttachment.mockImplementation((req) => ({
        metadata: { ...req.body },
        type: 'application/pdf',
        attachmentId: '123456789',
      }));

    const countDocuments = (patientId) =>
      models.DocumentMetadata.count({ where: { patientId, name: documentPayload.name } });

    it('creates one document when the same upload is submitted twice at once', async () => {
      mockUpload();
      const patient = await models.Patient.create(await createDummyPatient(models));
      const endpoint = `/api/patient/${patient.id}/documentMetadata`;

      // Fired together, so both requests are in flight before either has committed.
      const [first, second] = await Promise.all([
        app.post(endpoint).send(documentPayload),
        app.post(endpoint).send(documentPayload),
      ]);

      expect(first).toHaveSucceeded();
      expect(second).toHaveSucceeded();
      expect(await countDocuments(patient.id)).toBe(1);
      // Both callers are told about the same document.
      expect(first.body.id).toBe(second.body.id);
    });

    it('creates one document when the same upload is submitted twice in sequence', async () => {
      mockUpload();
      const patient = await models.Patient.create(await createDummyPatient(models));
      const endpoint = `/api/patient/${patient.id}/documentMetadata`;

      const first = await app.post(endpoint).send(documentPayload);
      const second = await app.post(endpoint).send(documentPayload);

      expect(first).toHaveSucceeded();
      expect(second).toHaveSucceeded();
      expect(await countDocuments(patient.id)).toBe(1);
      expect(first.body.id).toBe(second.body.id);
    });

    it('still creates a separate document for a different upload', async () => {
      mockUpload();
      const patient = await models.Patient.create(await createDummyPatient(models));
      const endpoint = `/api/patient/${patient.id}/documentMetadata`;

      const first = await app.post(endpoint).send(documentPayload);
      const second = await app
        .post(endpoint)
        .send({ ...documentPayload, name: 'a genuinely different document' });

      expect(first).toHaveSucceeded();
      expect(second).toHaveSucceeded();
      expect(first.body.id).not.toBe(second.body.id);
    });

    it('does not deduplicate across patients', async () => {
      mockUpload();
      const patientOne = await models.Patient.create(await createDummyPatient(models));
      const patientTwo = await models.Patient.create(await createDummyPatient(models));

      const first = await app
        .post(`/api/patient/${patientOne.id}/documentMetadata`)
        .send(documentPayload);
      const second = await app
        .post(`/api/patient/${patientTwo.id}/documentMetadata`)
        .send(documentPayload);

      expect(first).toHaveSucceeded();
      expect(second).toHaveSucceeded();
      expect(first.body.id).not.toBe(second.body.id);
      expect(await countDocuments(patientOne.id)).toBe(1);
      expect(await countDocuments(patientTwo.id)).toBe(1);
    });
  });
});
