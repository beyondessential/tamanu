import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';

import { createTestContext } from '../utilities';

const SUMMARY_URL = '/api/ai/patient/summary';

describe('AI Patient Summary (central-server)', () => {
  describe('with AI service enabled', () => {
    let ctx;
    let baseApp;
    let mockAiService;

    beforeAll(async () => {
      mockAiService = {
        invoke: jest.fn(async () => ({ content: 'Generated patient summary.' })),
      };
      ctx = await createTestContext({ aiService: mockAiService });
      baseApp = ctx.baseApp;
    });
    afterAll(() => ctx.close());

    it('should generate a summary via the AI service', async () => {
      const app = await baseApp.asRole('practitioner');
      const patientData = { name: 'Test Patient', conditions: [] };

      const result = await app.post(SUMMARY_URL).send({ patientData });

      expect(result).toHaveSucceeded();
      expect(result.body).toEqual({ content: 'Generated patient summary.' });
      expect(mockAiService.invoke).toHaveBeenCalled();
    });

    it('should include edit feedback in the AI prompt when provided', async () => {
      const app = await baseApp.asRole('practitioner');
      const patientData = { name: 'Test Patient' };
      const editFeedback = [
        { aiGenerated: 'Old summary', userEdited: 'Corrected summary' },
      ];

      const result = await app.post(SUMMARY_URL).send({ patientData, editFeedback });

      expect(result).toHaveSucceeded();
      const invokedMessage = mockAiService.invoke.mock.calls.at(-1)[1];
      expect(invokedMessage).toContain('Corrected summary');
    });

    describe('with db-defined permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should reject when user lacks Patient read permission', async () => {
        const app = await baseApp.asNewRole([]);
        const result = await app.post(SUMMARY_URL).send({ patientData: {} });

        expect(result).toBeForbidden();
      });

      it('should succeed with PatientSummary read permission', async () => {
        const app = await baseApp.asNewRole([['read', 'PatientSummary']]);
        const result = await app.post(SUMMARY_URL).send({ patientData: {} });

        expect(result).toHaveSucceeded();
      });
    });
  });

  describe('with AI service disabled', () => {
    let ctx;
    let baseApp;

    beforeAll(async () => {
      ctx = await createTestContext();
      baseApp = ctx.baseApp;
    });
    afterAll(() => ctx.close());

    it('should return 403 when AI service is not configured', async () => {
      const app = await baseApp.asRole('practitioner');
      const result = await app.post(SUMMARY_URL).send({ patientData: {} });

      expect(result).toBeForbidden();
      expect(result.body.error.message).toBe('AI service is not enabled or configured');
    });
  });
});
