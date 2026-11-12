import { test, expect } from '../../fixtures/baseFixture';
import {
  createPatientOngoingPrescriptionViaApi,
  getFacilityId,
  getUser,
  getPractitioners,
} from '@utils/apiHelpers';

test.describe('Medication - Patient', () => {
  test.describe.configure({ mode: 'parallel' });

  test('Discontinue ongoing medication defaults discontinued by to current user', async ({
    page,
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const currentUser = await getUser(api);
    const facilityId = await getFacilityId(page);
    await createPatientOngoingPrescriptionViaApi(api, newPatient.id, facilityId);

    await patientDetailsPage.goToPatient(newPatient);
    const medicationPane = await patientDetailsPage.navigateToPatientMedicationTab();

    const detailsModal = await medicationPane.clickFirstOngoingMedicationRow();
    const discontinueModal = await detailsModal.clickDiscontinue();

    await expect(discontinueModal.discontinuedByInput).toHaveValue(currentUser.displayName);
  });

  test('Discontinue ongoing medication allows changing the discontinued by user', async ({
    page,
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const currentUser = await getUser(api);

    // Changing the discontinued-by user requires another practitioner to switch to. Some
    // environments are seeded with a single user, so skip rather than fail when there's no
    // one else to select.
    const practitioners = await getPractitioners(api);
    const otherPractitioners = practitioners.filter(({ name }) => name !== currentUser.displayName);
    test.skip(
      otherPractitioners.length === 0,
      'Requires a second practitioner to switch the discontinued-by user to',
    );

    const facilityId = await getFacilityId(page);
    await createPatientOngoingPrescriptionViaApi(api, newPatient.id, facilityId);

    await patientDetailsPage.goToPatient(newPatient);
    const medicationPane = await patientDetailsPage.navigateToPatientMedicationTab();

    const detailsModal = await medicationPane.clickFirstOngoingMedicationRow();
    const discontinueModal = await detailsModal.clickDiscontinue();

    await discontinueModal.changeDiscontinuedBy(currentUser.displayName);
    await discontinueModal.fillReason('Test reason');
    const ongoingListReloaded = page.waitForResponse(response =>
      response.url().includes(`/patient/${newPatient.id}/ongoing-prescriptions`),
    );
    await discontinueModal.submit();

    // Discontinuing closes the details and reloads the ongoing list, so reopen the row once the
    // list has reloaded to see that it was discontinued rather than the form just closing.
    await detailsModal.dialog.waitFor({ state: 'hidden' });
    await ongoingListReloaded;
    const reopenedDetailsModal = await medicationPane.openFirstOngoingMedicationRow();
    await reopenedDetailsModal.waitForDiscontinuedStatus();
    await expect(reopenedDetailsModal.discontinuedStatus).toBeVisible();
  });
});
