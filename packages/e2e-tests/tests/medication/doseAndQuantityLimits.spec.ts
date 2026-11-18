import { test, expect } from '@fixtures/baseFixture';
import { createHospitalAdmissionEncounterViaAPI } from '@utils/apiHelpers';

// spec: DQLIM#prescribing, DQLIM#the-inline-warning
test.describe('Dose and dispensing quantity limits', () => {
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

    // The default provisioning data limits this drug to a dose of 1 to 2 tablets and a dispensing
    // quantity of 1 to 4 packs.
    const medicationName = 'Paracetamol 500mg Tablets';
    await prescriptionModal.selectMedicationByName(medicationName);

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
    await expect(medicationPane.tableBody).toContainText(medicationName);
  });
});
