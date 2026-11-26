import { test, expect } from '@fixtures/baseFixture';
import {
  createEncounterPrescriptionViaApi,
  createHospitalAdmissionEncounterViaAPI,
  createPharmacyOrderViaApi,
} from '@utils/apiHelpers';

// The default provisioning data limits this drug to a dose of 1 to 2 tablets and a dispensing
// quantity of 1 to 4 packs.
const LIMITED_DRUG = { id: 'drug-paracetamol500', name: 'Paracetamol 500mg Tablets' };

test.describe('Dose and dispensing quantity limits', () => {
  test.describe.configure({ mode: 'parallel' });

  // spec: DQLIM#prescribing, DQLIM#the-inline-warning
  test('Prescribing outside the drug limits shows a warning but still saves', async ({
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);

    await patientDetailsPage.goToPatient(newPatient);
    const medicationPane = await patientDetailsPage.navigateToMedicationTab();
    const prescriptionModal = await medicationPane.openNewPrescription();

    await prescriptionModal.selectMedicationByName(LIMITED_DRUG.name);

    await prescriptionModal.fillClinicalDetails({ doseAmount: '3' });
    await expect(prescriptionModal.doseLimitWarning).toHaveText('Above expected max of 2 tablets');

    // The warning follows the value as it changes, and clears once it is back in range.
    await prescriptionModal.doseAmountInput.fill('2');
    await expect(prescriptionModal.doseLimitWarning).toBeHidden();

    await prescriptionModal.setDispensingQuantity('10');
    await expect(prescriptionModal.dispensingQuantityLimitWarning).toHaveText(
      'Above expected max of 4 packs',
    );

    // The warning never stops the prescription being saved as entered.
    await prescriptionModal.finalise();
    await expect(medicationPane.tableBody).toContainText(LIMITED_DRUG.name);
  });

  // spec: DQLIM#dispensing, DQLIM#the-inline-warning
  test('Dispensing outside the drug limits shows a warning but still dispenses', async ({
    page,
    api,
    newPatient,
    medicationRequestsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id, undefined, {
      medicationId: LIMITED_DRUG.id,
    });
    // The request is for 1 pack, within the drug's limits.
    await createPharmacyOrderViaApi(api, page, encounter.id, prescription.id);

    await medicationRequestsPage.goto();
    const dispenseModal = await medicationRequestsPage.clickRowForPatient(newPatient.displayId);
    await dispenseModal.waitForModalToLoad();
    await expect(dispenseModal.getRowQuantityLimitWarning(0)).toBeHidden();

    await dispenseModal.getRowQuantityInput(0).fill('10');
    await expect(dispenseModal.getRowQuantityLimitWarning(0)).toHaveText(
      'Above expected max of 4 packs',
    );

    // The warning never stops the medication being dispensed as entered.
    await dispenseModal.dispenseWithoutLabelsButton.click();
    await expect(page.getByText('Medication successfully dispensed')).toBeVisible();
  });
});
