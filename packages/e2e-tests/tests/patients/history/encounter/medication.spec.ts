import { test, expect } from '@fixtures/baseFixture';
import {
  createHospitalAdmissionEncounterViaAPI,
  createEncounterPrescriptionViaApi,
  getFacilityId,
  getUser,
  getPractitioners,
} from '@utils/apiHelpers';
import { selectFieldOption } from '@utils/fieldHelpers';
import { MedicationDetailsModal } from '@pages/patients/MedicationsPage/modals/MedicationDetailsModal';

test.describe('Medication - Encounter', () => {
  test.describe.configure({ mode: 'parallel' });

  test('Prescribe a medication', async ({
    page,
    newPatientWithHospitalAdmission,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);

    const medicationPane = await patientDetailsPage.navigateToMedicationTab();
    await medicationPane.waitForPaneToLoad();

    // Open new prescription modal - first select prescription type
    await page.getByRole('button', { name: 'New prescription' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Fill medication via autocomplete
    const medicationInput = page
      .getByTestId('medication-field-medicationId-8k3m-input')
      .locator('input');
    await medicationInput.fill('Acetazolamide');
    const firstMedSuggestion = page
      .getByTestId('medication-field-medicationId-8k3m-option')
      .first();
    await firstMedSuggestion.waitFor({ state: 'visible' });
    await firstMedSuggestion.click();

    // Fill dose amount (dosing unit is auto-populated from the selected medication)
    await page.getByTestId('medication-field-doseAmount-3t6w').locator('input').fill('1');

    // Fill frequency via autocomplete
    const freqInput = page.getByTestId('medication-field-frequency-4c7z-input').locator('input');
    await freqInput.fill('Daily');
    const firstFreqSuggestion = page.getByTestId('medication-field-frequency-4c7z-option').first();
    await firstFreqSuggestion.waitFor({ state: 'visible' });
    await firstFreqSuggestion.click();

    // Fill route via SelectField (uses react-select; -select suffix is the clickable element)
    await selectFieldOption(page, page.getByTestId('medication-field-route-6d1b-select'), {
      selectFirst: true,
    });

    // Submit (prescriber and dates are auto-populated)
    await page.getByTestId('medication-button-finalise-7x3d').click();

    // Modal should close and table should show the new prescription
    await expect(page.getByRole('dialog')).toBeHidden();
    const tableBody = page.getByTestId('styledtablebody-a0jz');
    await expect(tableBody.getByRole('row').first()).toBeVisible();
  });

  test('Discontinue medication defaults discontinued by to current user', async ({
    page,
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const currentUser = await getUser(api);
    const facilityId = await getFacilityId(page);
    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    await createEncounterPrescriptionViaApi(api, encounter.id, facilityId);

    await patientDetailsPage.goToPatient(newPatient);
    const medicationPane = await patientDetailsPage.navigateToMedicationTab();
    await medicationPane.waitForPaneToLoad();

    await medicationPane.clickFirstMedicationRow();

    const detailsModal = new MedicationDetailsModal(page);
    await detailsModal.waitForModalToLoad();
    const discontinueModal = await detailsModal.clickDiscontinue();

    expect(await discontinueModal.getDiscontinuedByValue()).toBe(currentUser.displayName);
  });

  test('Discontinue medication allows changing the discontinued by user', async ({
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
    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    await createEncounterPrescriptionViaApi(api, encounter.id, facilityId);

    await patientDetailsPage.goToPatient(newPatient);
    const medicationPane = await patientDetailsPage.navigateToMedicationTab();
    await medicationPane.waitForPaneToLoad();

    await medicationPane.clickFirstMedicationRow();

    const detailsModal = new MedicationDetailsModal(page);
    await detailsModal.waitForModalToLoad();
    const discontinueModal = await detailsModal.clickDiscontinue();

    await discontinueModal.changeDiscontinuedBy(currentUser.displayName);
    await discontinueModal.fillReason('Test reason');
    await discontinueModal.submit();

    // The details modal stays open and re-renders as discontinued, confirming the
    // medication was actually discontinued rather than just the form closing.
    await detailsModal.waitForDiscontinuedStatus();
    await expect(detailsModal.discontinuedStatus).toBeVisible();
  });

  test('Send prescription to pharmacy', async ({ page, api, newPatient, patientDetailsPage }) => {
    test.setTimeout(60000);

    // Create encounter and prescription via API
    const facilityId = await getFacilityId(page);
    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    await createEncounterPrescriptionViaApi(api, encounter.id, facilityId);

    await patientDetailsPage.goToPatient(newPatient);

    const medicationPane = await patientDetailsPage.navigateToMedicationTab();
    await medicationPane.waitForPaneToLoad();

    // Send to pharmacy button should be visible now that there is a prescription
    await medicationPane.shoppingCartButton.waitFor({ state: 'visible' });
    await medicationPane.shoppingCartButton.click();

    // Wait for pharmacy order modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Send to pharmacy');

    // Select the prescription
    const prescriptionCheckbox = page.getByTestId('select-all-checkbox-controlcheck').first();
    await prescriptionCheckbox.waitFor({ state: 'visible' });
    await prescriptionCheckbox.click();

    // Fill quantity for the selected prescription
    const quantityInput = page.getByTestId('textinput-rxbh').locator('input').first();
    await quantityInput.fill('1');

    // Send the order
    await page.getByRole('button', { name: 'Send' }).click();

    // Success dialog should appear
    await expect(page.getByRole('dialog')).toContainText('Request sent');

    // Close success dialog (use testid to distinguish from the modal header's icon close button)
    await page.getByTestId('confirmbutton-tok1').click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
