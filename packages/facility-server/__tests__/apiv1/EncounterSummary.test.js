import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';

import { CentralServerConnection } from '../../dist/sync/CentralServerConnection';
import { createTestContext } from '../utilities';

const SUMMARY_URL = encounterId => `/api/ai/encounter/summary/${encounterId}`;

describe('EncounterSummary', () => {
  let baseApp;
  let encounterSummaryApp;
  let models;
  let ctx;
  let patient;
  let encounter;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    encounterSummaryApp = await baseApp.asRole('practitioner');
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
    });
  });
  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.AiDocument.truncate({ cascade: true, force: true });
  });

  describe('POST /:encounterId', () => {
    const mockAiContent = 'This is a generated encounter summary.';

    beforeEach(() => {
      CentralServerConnection.mockImplementation(() => ({
        fetch: jest.fn(async () => ({ content: mockAiContent })),
      }));
    });

    it('should generate a summary and persist an AiDocument', async () => {
      const result = await encounterSummaryApp.post(SUMMARY_URL(encounter.id)).send();

      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        type: 'encounter_summary',
        recordType: 'Encounter',
        recordId: encounter.id,
        content: mockAiContent,
        status: 'generated',
        source: 'ai',
      });

      const doc = await models.AiDocument.findOne({ where: { id: result.body.id } });
      expect(doc).not.toBeNull();
      expect(doc.content).toBe(mockAiContent);
    });

    it('should return 404 for a non-existent encounter', async () => {
      const result = await encounterSummaryApp
        .post(SUMMARY_URL('non-existent-encounter-id'))
        .send();

      expect(result).toHaveRequestError();
      expect(result.body.error.message).toBe('Encounter not found');
    });

    it('should reject unauthenticated requests', async () => {
      const result = await baseApp.post(SUMMARY_URL(encounter.id)).send();

      expect(result).toHaveRequestError();
    });

    describe('with db-defined permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should reject when user lacks EncounterSummary create permission', async () => {
        const app = await baseApp.asNewRole([['read', 'Encounter']]);
        const result = await app.post(SUMMARY_URL(encounter.id)).send();

        expect(result).toBeForbidden();
      });

      it('should succeed when user has EncounterSummary create permission', async () => {
        const app = await baseApp.asNewRole([['create', 'EncounterSummary']]);
        const result = await app.post(SUMMARY_URL(encounter.id)).send();

        expect(result).toHaveSucceeded();
        expect(result.body.content).toBe(mockAiContent);
      });
    });
  });

  describe('GET /:encounterId', () => {
    it('should return an existing AiDocument', async () => {
      const doc = await models.AiDocument.create({
        type: 'encounter_summary',
        recordType: 'Encounter',
        recordId: encounter.id,
        content: 'Existing encounter summary',
      });
      const result = await encounterSummaryApp.get(SUMMARY_URL(encounter.id));

      expect(result).toHaveSucceeded();
      expect(result.body.aiDocument).toMatchObject({
        id: doc.id,
        content: 'Existing encounter summary',
        recordId: encounter.id,
      });
    });

    it('should return null when no document exists', async () => {
      const result = await encounterSummaryApp.get(SUMMARY_URL('encounter-with-no-doc'));

      expect(result).toHaveSucceeded();
      expect(result.body.aiDocument).toBeNull();
    });

    it('should reject unauthenticated requests', async () => {
      const result = await baseApp.get(SUMMARY_URL(encounter.id));

      expect(result).toHaveRequestError();
    });

    describe('with db-defined permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should reject when user lacks EncounterSummary write permission', async () => {
        const app = await baseApp.asNewRole([]);
        const result = await app.get(SUMMARY_URL(encounter.id));

        expect(result).toBeForbidden();
      });

      it('should succeed with EncounterSummary read permission', async () => {
        const app = await baseApp.asNewRole([['read', 'EncounterSummary']]);
        const result = await app.get(SUMMARY_URL(encounter.id));

        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('aiDocument');
      });
    });
  });

  describe('PUT /:id', () => {
    const DOC_URL = id => `/api/ai/encounter/summary/${id}`;

    async function createAiDocument() {
      return models.AiDocument.create({
        type: 'encounter_summary',
        recordType: 'Encounter',
        recordId: encounter.id,
        content: 'Original AI content',
      });
    }

    it('should edit an AiDocument', async () => {
      const doc = await createAiDocument();
      const result = await encounterSummaryApp
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
      const result = await encounterSummaryApp
        .put(DOC_URL(doc.id))
        .send({ status: 'discarded' });

      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        id: doc.id,
        status: 'discarded',
        source: 'human',
      });

      await doc.reload();
      expect(doc.content).toBeNull();
      expect(doc.status).toBe('discarded');
    });

    it('should return 404 for a non-existent document', async () => {
      const result = await encounterSummaryApp
        .put(DOC_URL('non-existent-id'))
        .send({ content: 'Updated' });

      expect(result).toHaveRequestError();
      expect(result.body.error.message).toBe('AI document not found');
    });

    describe('with db-defined permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should reject when user lacks EncounterSummary write permission', async () => {
        const doc = await createAiDocument();
        const app = await baseApp.asNewRole([['read', 'Encounter']]);
        const result = await app.put(DOC_URL(doc.id)).send({ content: 'Edited' });

        expect(result).toBeForbidden();
      });

      it('should succeed with EncounterSummary write permission', async () => {
        const doc = await createAiDocument();
        const app = await baseApp.asNewRole([['write', 'EncounterSummary']]);
        const result = await app.put(DOC_URL(doc.id)).send({ content: 'Edited' });

        expect(result).toHaveSucceeded();
        expect(result.body.status).toBe('edited');
      });
    });
  });
});
