import { test, expect } from '@fixtures/baseFixture';
import { createDischargedEncounterWithoutRecordViaApi } from '@utils/apiHelpers';

// A discharged encounter normally has a discharge record, but encounters closed by the outpatient
// discharger before v1.26.0 have an end date and no record. Production deployments still hold
// these, and the client has to present them as the discharged encounters they are.
test.describe('Discharged encounter without a discharge record', () => {
  // TODO: assign TestRail/AT ids per the suite convention once allocated.
  test('offers the encounter record and discharge summary', async ({
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(90_000);

    await createDischargedEncounterWithoutRecordViaApi(api, newPatient.id);

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();

    // The discharged-encounter actions, not the active-encounter ones.
    await expect(patientDetailsPage.dischargeSummaryButton).toBeVisible();
    await expect(patientDetailsPage.encounterRecordButton).toBeVisible();
    await expect(patientDetailsPage.prepareDischargeButton).toHaveCount(0);

    // The encounter record opens as a record, not a progress record, and renders its PDF.
    await patientDetailsPage.openEncounterRecord();
    await expect(patientDetailsPage.modalTitle).toHaveText('Encounter record');
    const pdfFrame = patientDetailsPage.encounterRecordPdfFrame;
    await expect(pdfFrame).toBeVisible({ timeout: 60_000 });
    await expect(pdfFrame).toHaveAttribute('src', /^blob:/, { timeout: 60_000 });
    await expect(
      patientDetailsPage.page.getByText('The document could not be generated'),
    ).toHaveCount(0);
  });

  // TODO: assign TestRail/AT ids per the suite convention once allocated.
  test('renders the discharge summary', async ({ api, newPatient, patientDetailsPage }) => {
    test.setTimeout(90_000);

    await createDischargedEncounterWithoutRecordViaApi(api, newPatient.id);

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.dischargeSummaryButton.click();

    // The summary page renders its PDF (a blob: URL in the viewer iframe) rather than the
    // could-not-generate fallback. Without a discharge record this used to throw while building
    // the letterhead.
    await expect(
      patientDetailsPage.page.getByRole('button', { name: 'Print Summary' }),
    ).toBeVisible();
    const pdfFrame = patientDetailsPage.dischargeSummaryPdfFrame;
    await expect(pdfFrame).toBeVisible({ timeout: 60_000 });
    await expect(pdfFrame).toHaveAttribute('src', /^blob:/, { timeout: 60_000 });
    await expect(patientDetailsPage.dischargeSummaryPdfError).toHaveCount(0);
  });
});
