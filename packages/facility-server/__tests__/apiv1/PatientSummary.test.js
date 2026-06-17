import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';

import { CentralServerConnection } from '../../app/sync/CentralServerConnection';
import { createTestContext } from '../utilities';

const SUMMARY_URL = patientId => `/api/ai/patient/summary/${patientId}`;

describe('PatientSummary', () => {
  let baseApp;
  let patientSummaryApp;
  let models;
  let ctx;
  let patient;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    patientSummaryApp = await baseApp.asRole('practitioner');
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
  });
  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.AiDocument.truncate({ cascade: true, force: true });
  });

  describe('POST /:patientId', () => {
    const mockAiContent = 'This is a generated patient summary.';

    beforeEach(() => {
      CentralServerConnection.mockImplementation(() => ({
        fetch: jest.fn(async () => ({ content: mockAiContent })),
      }));
    });

    it('should generate a summary and persist an AiDocument', async () => {
      const result = await patientSummaryApp.post(SUMMARY_URL(patient.id)).send();

      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        type: 'patient_summary',
        recordType: 'Patient',
        recordId: patient.id,
        content: mockAiContent,
        status: 'generated',
        source: 'ai',
      });

      // Verify persistence (composite primary key, so look up by the unique generated id)
      const doc = await models.AiDocument.findOne({ where: { id: result.body.id } });
      expect(doc).not.toBeNull();
      expect(doc.content).toBe(mockAiContent);
    });

    it('should return 404 for a non-existent patient', async () => {
      const result = await patientSummaryApp.post(SUMMARY_URL('non-existent-patient-id')).send();

      expect(result).toHaveRequestError();
      expect(result.body.error.message).toBe('Patient not found');
    });

    it('should reject unauthenticated requests', async () => {
      const result = await baseApp.post(SUMMARY_URL(patient.id)).send();

      expect(result).toHaveRequestError();
    });

    describe('with db-defined permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should reject when user lacks Patient read permission', async () => {
        const app = await baseApp.asNewRole([['create', 'PatientSummary']]);
        const result = await app.post(SUMMARY_URL(patient.id)).send();

        expect(result).toBeForbidden();
      });

      it('should reject when user lacks PatientSummary create permission', async () => {
        const app = await baseApp.asNewRole([['read', 'Patient']]);
        const result = await app.post(SUMMARY_URL(patient.id)).send();

        expect(result).toBeForbidden();
      });

      it('should succeed when user has both required permissions', async () => {
        const app = await baseApp.asNewRole([
          ['write', 'PatientSummary'],
          ['create', 'PatientSummary'],
        ]);
        const result = await app.post(SUMMARY_URL(patient.id)).send();

        expect(result).toHaveSucceeded();
        expect(result.body.content).toBe(mockAiContent);
      });
    });
  });

  describe('GET /:patientId', () => {
    it('should return an existing AiDocument', async () => {
      const doc = await models.AiDocument.create({
        type: 'patient_summary',
        recordType: 'Patient',
        recordId: patient.id,
        content: 'Existing summary',
      });
      const result = await patientSummaryApp.get(SUMMARY_URL(patient.id));

      expect(result).toHaveSucceeded();
      expect(result.body.aiDocument).toMatchObject({
        id: doc.id,
        content: 'Existing summary',
        recordId: patient.id,
      });
    });

    it('should return null when no document exists', async () => {
      const result = await patientSummaryApp.get(SUMMARY_URL('patient-with-no-doc'));

      expect(result).toHaveSucceeded();
      expect(result.body.aiDocument).toBeNull();
    });

    it('should reject unauthenticated requests', async () => {
      const result = await baseApp.get(SUMMARY_URL(patient.id));

      expect(result).toHaveRequestError();
    });

    describe('with db-defined permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should reject when user lacks Patient read permission', async () => {
        const app = await baseApp.asNewRole([]);
        const result = await app.get(SUMMARY_URL(patient.id));

        expect(result).toBeForbidden();
      });

      it('should succeed with Patient read permission', async () => {
        const app = await baseApp.asNewRole([['read', 'PatientSummary']]);
        const result = await app.get(SUMMARY_URL(patient.id));

        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('aiDocument');
      });
    });
  });

  describe('PUT /:id', () => {
    const DOC_URL = id => `/api/ai/patient/summary/${id}`;

    async function createAiDocument() {
      return models.AiDocument.create({
        type: 'patient_summary',
        recordType: 'Patient',
        recordId: patient.id,
        content: 'Original AI content',
      });
    }

    it('should edit an AiDocument', async () => {
      const doc = await createAiDocument();
      const result = await patientSummaryApp
        .put(DOC_URL(doc.id))
        .send({ content: 'Edited content' });

      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        id: doc.id,
        status: 'edited',
        source: 'human',
        content: 'Edited content',
      });

      await doc.reload();
      expect(doc.content).toBe('Edited content');
      expect(doc.status).toBe('edited');
      expect(doc.source).toBe('human');
    });

    it('should discard an AiDocument and set content to null', async () => {
      const doc = await createAiDocument();
      const result = await patientSummaryApp.put(DOC_URL(doc.id)).send({ status: 'discarded' });

      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        id: doc.id,
        status: 'discarded',
        source: 'human',
      });
      expect(result.body.content).not.toBeDefined();

      await doc.reload();
      expect(doc.content).toBeNull();
      expect(doc.status).toBe('discarded');
    });

    it('should return 404 for a non-existent document', async () => {
      const result = await patientSummaryApp
        .put(DOC_URL('non-existent-id'))
        .send({ content: 'Updated' });

      expect(result).toHaveRequestError();
      expect(result.body.error.message).toBe('AI document not found');
    });

    it('should reject edit without content', async () => {
      const doc = await createAiDocument();
      const result = await patientSummaryApp.put(DOC_URL(doc.id)).send({});

      expect(result).toHaveRequestError();
      expect(result.body.error.message).toBe('Content is required');
    });

    describe('with db-defined permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should reject when user lacks PatientSummary write permission', async () => {
        const doc = await createAiDocument();
        const app = await baseApp.asNewRole([['read', 'Patient']]);
        const result = await app.put(DOC_URL(doc.id)).send({ content: 'Edited' });

        expect(result).toBeForbidden();
      });

      it('should succeed with PatientSummary write permission', async () => {
        const doc = await createAiDocument();
        const app = await baseApp.asNewRole([['write', 'PatientSummary']]);
        const result = await app.put(DOC_URL(doc.id)).send({ content: 'Edited' });

        expect(result).toHaveSucceeded();
        expect(result.body.status).toBe('edited');
      });
    });
  });
});
