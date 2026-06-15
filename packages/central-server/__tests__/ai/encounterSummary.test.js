import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import {
  setHardcodedPermissionsUseForTestsOnly,
  unsetUseHardcodedPermissionsUseForTestsOnly,
} from '@tamanu/shared/permissions/rolesToPermissions';

import { createTestContext } from '../utilities';

const SUMMARY_URL = '/api/ai/encounter/summary';
const encounterData = {
  patient: { displayId: 'TEST-001', firstName: 'Test', lastName: 'Patient' },
  encounter: { id: 'encounter-001', encounterType: 'admission' },
  diagnoses: [],
  procedures: [],
  medications: [],
  notes: [],
};

describe('AI Encounter Summary (central-server)', () => {
  describe('with AI service enabled', () => {
    let ctx;
    let baseApp;
    let encounterSummaryApp;
    let mockAiService;

    beforeAll(async () => {
      mockAiService = {
        invoke: jest.fn(async () => ({ content: 'Generated encounter summary.' })),
      };
      setHardcodedPermissionsUseForTestsOnly(true);
      ctx = await createTestContext({ aiService: mockAiService });
      baseApp = ctx.baseApp;
      encounterSummaryApp = await baseApp.asRole('practitioner');
    });
    afterAll(() => {
      unsetUseHardcodedPermissionsUseForTestsOnly();
    });
    afterAll(() => ctx.close());

    it('should generate a summary via the AI service', async () => {
      const result = await encounterSummaryApp.post(SUMMARY_URL).send({ encounterData });

      expect(result).toHaveSucceeded();
      expect(result.body).toEqual({ content: 'Generated encounter summary.' });
      expect(mockAiService.invoke).toHaveBeenCalled();
    });

    it('should include edit feedback in the AI prompt when provided', async () => {
      const editFeedback = [
        { aiGenerated: 'Old encounter summary', userEdited: 'Corrected encounter summary' },
      ];

      const result = await encounterSummaryApp
        .post(SUMMARY_URL)
        .send({ encounterData, editFeedback });

      expect(result).toHaveSucceeded();
      const invokedMessage = mockAiService.invoke.mock.calls.at(-1)[1];
      expect(invokedMessage).toContain('Corrected encounter summary');
    });

    describe('with db-defined permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should reject when user lacks Discharge write permission', async () => {
        const app = await baseApp.asNewRole([]);
        const result = await app.post(SUMMARY_URL).send({ encounterData });

        expect(result).toBeForbidden();
      });

      it('should succeed with Discharge write permission', async () => {
        const app = await baseApp.asNewRole([['write', 'Discharge']]);
        const result = await app.post(SUMMARY_URL).send({ encounterData });

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
      setHardcodedPermissionsUseForTestsOnly(true);
    });
    afterAll(() => {
      unsetUseHardcodedPermissionsUseForTestsOnly();
    });
    afterAll(() => ctx.close());

    it('should return 403 when AI service is not configured', async () => {
      const app = await baseApp.asRole('practitioner');
      const result = await app.post(SUMMARY_URL).send({ encounterData });

      expect(result).toBeForbidden();
      expect(result.body.error.message).toBe('AI service is not enabled or configured');
    });
  });
});
