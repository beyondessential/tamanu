import { Page } from '@playwright/test';

import { test, expect } from '@fixtures/baseFixture';

type AiEncounterDocument = {
  id: string;
  type: 'discharge';
  recordType: 'Encounter';
  recordId: string;
  content: string | null;
  status: 'generated' | 'edited' | 'discarded';
  source: 'ai' | 'human';
};

const installAiEncounterSummaryMock = async ({
  page,
  generatedSummary,
}: {
  page: Page;
  generatedSummary: string;
}) => {
  const state = { aiDocument: null as AiEncounterDocument | null };

  await page.route('**/api/ai/encounter/summary/**', async route => {
    const request = route.request();
    const method = request.method();

    if (method === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ aiDocument: state.aiDocument }),
      });
      return;
    }

    if (method === 'POST') {
      const url = new URL(request.url());
      const encounterId = decodeURIComponent(url.pathname.split('/').pop() ?? '');
      state.aiDocument = {
        id: `discharge;Encounter;${encounterId}`,
        type: 'discharge',
        recordType: 'Encounter',
        recordId: encounterId,
        content: generatedSummary,
        status: 'generated',
        source: 'ai',
      };
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(state.aiDocument),
      });
      return;
    }

    if (method === 'PUT') {
      const body = request.postDataJSON();
      const isDiscard = body.status === 'discarded';
      state.aiDocument = {
        ...(state.aiDocument as AiEncounterDocument),
        content: isDiscard ? null : body.content,
        status: isDiscard ? 'discarded' : 'edited',
        source: 'human',
      };
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(state.aiDocument),
      });
      return;
    }

    await route.continue();
  });
};

test.describe('AI encounter summary', () => {
  test('should generate and edit an AI encounter summary on discharge', async ({
    page,
    newPatientWithHospitalAdmission,
    patientDetailsPage,
  }) => {
    const generatedSummary = 'Generated AI encounter summary for E2E testing.';
    const editedSummary = 'Clinician edited AI encounter summary for E2E testing.';

    await installAiEncounterSummaryMock({ page, generatedSummary });

    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const summarySection = page.getByTestId('discharge-encounter-summary');
    await expect(summarySection).toBeVisible();

    await page.getByTestId('encounter-summary-generate').click();
    await expect(summarySection).toContainText(generatedSummary);

    await page.getByTestId('encounter-summary-edit').click();
    await page.getByTestId('encounter-summary-textarea').fill(editedSummary);
    await page.getByTestId('encounter-summary-save').click();

    await expect(page.getByTestId('encounter-summary-textarea')).toBeHidden();
    await expect(summarySection).toContainText(editedSummary);
    await expect(summarySection).toContainText('(edited)');
  });

  test('should discard an AI encounter summary via the confirmation modal', async ({
    page,
    newPatientWithHospitalAdmission,
    patientDetailsPage,
  }) => {
    const generatedSummary = 'Generated AI encounter summary for E2E testing.';

    await installAiEncounterSummaryMock({ page, generatedSummary });

    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const summarySection = page.getByTestId('discharge-encounter-summary');
    await page.getByTestId('encounter-summary-generate').click();
    await expect(summarySection).toContainText(generatedSummary);

    await page.getByTestId('encounter-summary-discard').click();

    const discardModal = page.getByRole('dialog', { name: 'Discard AI summary' });
    await expect(discardModal).toBeVisible();
    await discardModal.getByRole('button', { name: 'Discard' }).click();

    await expect(summarySection).not.toContainText(generatedSummary);
    await expect(page.getByTestId('encounter-summary-generate')).toBeVisible();
  });
});
