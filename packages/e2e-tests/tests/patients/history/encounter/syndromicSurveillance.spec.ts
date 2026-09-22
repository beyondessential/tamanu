import { test, expect } from '@fixtures/baseFixture';
import { createHospitalAdmissionEncounterViaAPI } from '@utils/apiHelpers';

test.describe('Syndromic surveillance', () => {
  test('Record no syndrome from the diagnosis pane and see it reflected after reopening', async ({
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.navigateToDiagnosisTab();

    const syndromicSurveillanceStatus = patientDetailsPage.getSyndromicSurveillanceStatus();
    const syndromicSurveillanceModal = patientDetailsPage.getSyndromicSurveillanceModal();

    // Nothing recorded yet: the status is a link inviting the clinician to record it.
    await expect(syndromicSurveillanceStatus.container).toBeVisible();
    await syndromicSurveillanceStatus.open();

    await syndromicSurveillanceModal.waitForModalToLoad();
    await syndromicSurveillanceModal.selectNoSyndrome();
    await syndromicSurveillanceModal.confirm();

    // The pane reflects what was just recorded without needing a page reload.
    await expect(syndromicSurveillanceStatus.container).toContainText('No syndrome');

    // Reopening the modal shows the same recorded state, proving it round-tripped through the
    // server rather than only living in the form's local state.
    await syndromicSurveillanceStatus.open();
    await syndromicSurveillanceModal.waitForModalToLoad();
    await expect(syndromicSurveillanceModal.noSyndromeCheckbox).toBeChecked();
  });
});
