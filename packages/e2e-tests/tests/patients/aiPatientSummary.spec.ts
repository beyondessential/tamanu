import { Page } from '@playwright/test';

import { test, expect } from '@fixtures/baseFixture';

type AiDocument = {
  id: string;
  type: 'patient_summary';
  recordType: 'Patient';
  recordId: string;
  content: string | null;
  status: 'generated' | 'edited' | 'discarded';
  source: 'ai' | 'human';
};

const installAiPatientSummaryMock = async ({
  page,
  patientId,
  generatedSummary,
}: {
  page: Page;
  patientId: string;
  generatedSummary: string;
}) => {
  const aiDocumentId = `patient_summary;Patient;${patientId}`;
  const state = { aiDocument: null as AiDocument | null };

  const buildGenerated = (): AiDocument => ({
    id: aiDocumentId,
    type: 'patient_summary',
    recordType: 'Patient',
    recordId: patientId,
    content: generatedSummary,
    status: 'generated',
    source: 'ai',
  });

  await page.route('**/api/ai/patient/summary/**', async route => {
    const request = route.request();
    const method = request.method();

    if (method === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          aiDocument: state.aiDocument,
          requiresRegeneration: false,
        }),
      });
      return;
    }

    if (method === 'POST') {
      state.aiDocument = buildGenerated();
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(state.aiDocument),
      });
      return;
    }

    if (method === 'PUT') {
      const body = request.postDataJSON();
      state.aiDocument = {
        ...(state.aiDocument as AiDocument),
        content: body.content,
        status: body.status,
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

test.describe('AI patient summary', () => {
  test('should generate and edit an AI patient summary', async ({
    page,
    newPatientWithHospitalAdmission,
    patientDetailsPage,
  }) => {
    const generatedSummary = 'Generated AI patient summary for E2E testing.';
    const editedSummary = 'Clinician edited AI patient summary for E2E testing.';

    await installAiPatientSummaryMock({
      page,
      patientId: newPatientWithHospitalAdmission.id,
      generatedSummary,
    });

    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);

    const summaryCard = page.getByTestId('ai-patient-summary');
    await expect(summaryCard).toBeVisible();
    await expect(summaryCard).toContainText(generatedSummary);

    await page.getByTestId('ai-summary-edit').click();
    await page.getByTestId('ai-summary-textarea').fill(editedSummary);
    await page.getByTestId('ai-summary-save').click();

    await expect(page.getByTestId('ai-summary-textarea')).toBeHidden();
    await expect(summaryCard).toContainText(editedSummary);
    await expect(summaryCard).toContainText('(edited)');
  });

  test('should discard and regenerate an AI patient summary', async ({
    page,
    newPatientWithHospitalAdmission,
    patientDetailsPage,
  }) => {
    const generatedSummary = 'Generated AI patient summary for E2E testing.';

    await installAiPatientSummaryMock({
      page,
      patientId: newPatientWithHospitalAdmission.id,
      generatedSummary,
    });

    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);

    const summaryCard = page.getByTestId('ai-patient-summary');
    await expect(summaryCard).toBeVisible();
    await expect(summaryCard).toContainText(generatedSummary);

    await page.getByTestId('ai-summary-edit').click();
    await page.getByTestId('ai-summary-discard').click();

    const discardModal = page.getByRole('dialog');
    await expect(discardModal).toBeVisible();
    await discardModal.getByRole('button', { name: 'Discard' }).click();

    await expect(summaryCard).toContainText('AI patient summary has been discarded');
    await expect(summaryCard).not.toContainText(generatedSummary);

    await page.getByTestId('ai-summary-regenerate').click();

    await expect(summaryCard).toContainText(generatedSummary);
    await expect(summaryCard).not.toContainText('AI patient summary has been discarded');
  });
});
