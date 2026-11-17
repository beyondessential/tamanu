import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { test, expect } from '@fixtures/baseFixture';

const TEST_PDF = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/files/test.pdf',
);

test.setTimeout(60000);

// spec: ATCH
// A rendered page proves the round trip; the row alone would pass on a hash pointing at nothing.
test.describe('Documents', () => {
  test.beforeEach(async ({ newPatient, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatient);
  });

  test('Add a patient document', async ({ patientDetailsPage }) => {
    const documentsPane = await patientDetailsPage.navigateToDocumentsTab();

    const { department } = await documentsPane.addDocument({
      fileName: 'Discharge summary',
      documentOwner: 'Dr Kamaka',
      note: 'Uploaded during E2E',
      filePath: TEST_PDF,
    });

    await expect(documentsPane.tableRows).toHaveCount(1);
    await expect(documentsPane.getTableCell(0, 0)).toHaveText('Discharge summary');
    await expect(documentsPane.getTableCell(0, 3)).toHaveText('Dr Kamaka');
    await expect(documentsPane.getTableCell(0, 4)).toHaveText(department);
  });

  test('Preview an uploaded document', async ({ patientDetailsPage }) => {
    const documentsPane = await patientDetailsPage.navigateToDocumentsTab();
    await documentsPane.addDocument({
      fileName: 'Referral letter',
      filePath: TEST_PDF,
    });

    const previewModal = await documentsPane.openDocumentPreview();
    await previewModal.waitForFirstPageToRender();

    await expect(previewModal.pdfPages.first()).toBeVisible();
    await expect(previewModal.downloadButton).toBeVisible();
  });

  test('Upload several documents and preview the newest', async ({ patientDetailsPage }) => {
    const documentsPane = await patientDetailsPage.navigateToDocumentsTab();
    const fileNames = ['First upload', 'Second upload', 'Third upload'];

    for (const fileName of fileNames) {
      await documentsPane.addDocument({ fileName, filePath: TEST_PDF });
    }

    await expect(documentsPane.tableRows).toHaveCount(fileNames.length);

    // Identical bytes deduplicate, so each row must still resolve its own content.
    const previewModal = await documentsPane.openDocumentPreview();
    await previewModal.waitForFirstPageToRender();
    await expect(previewModal.pdfPages.first()).toBeVisible();
  });
});
