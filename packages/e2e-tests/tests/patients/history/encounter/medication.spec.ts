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

    // Dispensing quantity auto-calculation (medications.dispensing.dispensingQuantityAutocalculation
    // is enabled for the suite via provisioning). The quantity is empty until a duration is entered,
    // then the DispensingQuantityAutocalculator populates it reactively from dose, frequency and
    // duration.
    const quantityInput = page.getByTestId('medication-field-quantity-6j9m').locator('input');
    await expect(quantityInput).toHaveValue('');

    await page.getByTestId('medication-field-durationValue-7p2n').locator('input').fill('90');
    await selectFieldOption(page, page.getByTestId('medication-field-durationUnit-4q8f-select'), {
      optionToSelect: 'day (s)',
    });

    // Acetazolamide dispenses in packs of 30 tablets (unitConversion 30), so a course of
    // 1 tablet × Daily (1 dose/day) × 90 days = 90 tablets ÷ 30 = 3 packs.
    await expect(quantityInput).toHaveValue('3');

    // Submit (prescriber and dates are auto-populated)
    await page.getByTestId('medication-button-finalise-7x3d').click();

    // Modal should close and table should show the new prescription
    await expect(page.getByRole('dialog')).toBeHidden();
    const tableBody = page.getByTestId('styledtablebody-a0jz');
    await expect(tableBody.getByRole('row').first()).toBeVisible();
  });

  test('Auto-calculates dispensing quantity for a medication set member with a pack conversion', async ({
    page,
    newPatientWithHospitalAdmission,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);

    const medicationPane = await patientDetailsPage.navigateToMedicationTab();
    await medicationPane.waitForPaneToLoad();

    // Open the new-prescription flow and choose the medication-set path (the type modal appears
    // because the seed data includes a medication set).
    await page.getByRole('button', { name: 'New prescription' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByText('Medication set', { exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Select the seeded "Post-surgical set"; its members' dispensing quantities are calculated on
    // selection and shown in the medications list on the right.
    await dialog.getByText('Post-surgical set', { exact: true }).click();

    // The set's Amoxicillin member dispenses in Blister Packs of 10 (unitConversion 10). A course of
    // 1 capsule x Three times daily (3 doses/day) x 7 days = 21 capsules / 10 = ceil(2.1) = 3 packs.
    // This exercises the medication set suggester carrying referenceDrug.unitConversion through to the
    // client: a regression that drops it (the four-deep alias exceeding PostgreSQL's 63-byte limit and
    // being silently truncated) falls back to a conversion of 1 and would show "21 Blister Packs".
    await expect(dialog.getByText('Dispensing quantity: 3 Blister Packs')).toBeVisible();
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
