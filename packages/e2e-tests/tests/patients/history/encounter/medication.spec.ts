import { test, expect } from '@fixtures/baseFixture';
import {
  createHospitalAdmissionEncounterViaAPI,
  createEncounterPrescriptionViaApi,
} from '@utils/apiHelpers';
import { selectFieldOption } from '@utils/fieldHelpers';

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

    // Fill dose amount
    await page.getByTestId('medication-field-doseAmount-3t6w').locator('input').fill('1');

    // Fill units via SelectField (uses react-select; -select suffix is the clickable element)
    await selectFieldOption(page, page.getByTestId('medication-field-units-2r9v-select'), {
      selectFirst: true,
    });

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

  test('Send prescription to pharmacy', async ({ page, api, newPatient, patientDetailsPage }) => {
    test.setTimeout(60000);

    // Create encounter and prescription via API
    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    await createEncounterPrescriptionViaApi(api, encounter.id);

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
