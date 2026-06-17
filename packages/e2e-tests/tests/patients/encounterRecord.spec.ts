import { test, expect } from '@fixtures/baseFixture';
import {
  createEncounterNotes,
  createHospitalAdmissionEncounterViaAPI,
  getUser,
} from '@utils/apiHelpers';

// Smoke coverage for the chunked encounter-record PDF pipeline: opening the record renders every
// section as bounded chunks in web workers, merges them, stamps page numbers, and shows the
// result in an iframe. We assert the document is produced and displayed; the chunk/merge maths
// (which only differs visibly at hundreds of notes) is covered by unit tests.
test.describe('Encounter record print', () => {
  // TODO: assign TestRail/AT ids per the suite convention once allocated.
  test('renders the encounter progress record PDF in the viewer', async ({
    newPatientWithHospitalAdmission,
    patientDetailsPage,
  }) => {
    // Arrange: an active hospital admission, which offers the "Encounter progress record" action.
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToFirstEncounter();

    // Act: open the encounter record PDF viewer.
    await patientDetailsPage.openEncounterProgressRecord();

    // Assert: the PDF is generated and displayed (a blob: URL in the viewer iframe). Rendering
    // and merging happen in workers, so allow generous time.
    const pdfFrame = patientDetailsPage.encounterRecordPdfFrame;
    await expect(pdfFrame).toBeVisible({ timeout: 60_000 });
    await expect(pdfFrame).toHaveAttribute('src', /^blob:/, { timeout: 60_000 });

    // A failed render/merge would show the error fallback instead of the iframe.
    await expect(
      patientDetailsPage.page.getByText('The document could not be generated'),
    ).toHaveCount(0);
  });

  // Heavy: seeds enough notes to span several render chunks (chunk size 500), forcing multiple
  // pool waves, the progress indicator, and a real multi-document merge.
  // TODO: assign TestRail/AT ids per the suite convention once allocated.
  test(
    'renders a 3,000-note encounter record through the chunked pipeline',
    { tag: '@slow' },
    async ({ api, newPatient, patientDetailsPage }) => {
      test.setTimeout(300_000);

      // Arrange: an admission with 3,000 notes (≈6 chunks → main + 5 continuations).
      const user = await getUser(api);
      const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
      await createEncounterNotes(api, encounter.id, user.id, 3000);

      await patientDetailsPage.goToPatient(newPatient);
      await patientDetailsPage.navigateToFirstEncounter();

      // Act
      await patientDetailsPage.openEncounterProgressRecord();

      // Assert: the chunked render reports progress...
      await expect(patientDetailsPage.encounterRecordPdfProgress).toBeVisible({ timeout: 60_000 });

      // ...and the merged PDF is ultimately produced and displayed.
      const pdfFrame = patientDetailsPage.encounterRecordPdfFrame;
      await expect(pdfFrame).toBeVisible({ timeout: 240_000 });
      await expect(pdfFrame).toHaveAttribute('src', /^blob:/, { timeout: 240_000 });
      await expect(
        patientDetailsPage.page.getByText('The document could not be generated'),
      ).toHaveCount(0);
    },
  );
});
