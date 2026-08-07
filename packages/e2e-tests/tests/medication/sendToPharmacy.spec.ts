import { test, expect } from '@fixtures/baseFixture';
import { createHospitalAdmissionEncounterViaAPI } from '@utils/apiHelpers';

test.describe('Send a new prescription to pharmacy', () => {
  test.describe.configure({ mode: 'parallel' });

  test('Prescribing with Send to pharmacy raises a request', async ({
    api,
    newPatient,
    patientDetailsPage,
    medicationRequestsPage,
  }) => {
    test.setTimeout(60000);

    await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);

    await patientDetailsPage.goToPatient(newPatient);
    const medicationPane = await patientDetailsPage.navigateToMedicationTab();
    const prescriptionModal = await medicationPane.openNewPrescription();

    const medicationName = await prescriptionModal.selectMedication();
    await prescriptionModal.fillClinicalDetails();

    // Send to pharmacy starts unticked, and prescription type only appears once it is ticked.
    await expect(prescriptionModal.sendToPharmacyCheckbox).not.toBeChecked();
    await expect(prescriptionModal.prescriptionTypeLabel).toBeHidden();

    await prescriptionModal.tickSendToPharmacy();

    // An admission encounter defaults to Inpatient under the shipped setting.
    await expect(prescriptionModal.prescriptionTypeOption('Inpatient')).toBeChecked();

    await prescriptionModal.setDispensingQuantity('12');
    await prescriptionModal.finalise();

    // The prescription lands on the encounter's medication table...
    await expect(medicationPane.tableBody).toContainText(medicationName);

    // ...and the pharmacy request is waiting on the worklist, as an inpatient prescription.
    await medicationRequestsPage.goto();
    const row = medicationRequestsPage.rowForPatient(newPatient.displayId);
    await expect(row).toBeVisible();
    await expect(row).toContainText(medicationName);
    await expect(row).toContainText('Inpatient');
  });

  test('Prescribing without Send to pharmacy raises no request', async ({
    api,
    newPatient,
    patientDetailsPage,
    medicationRequestsPage,
  }) => {
    test.setTimeout(60000);

    await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);

    await patientDetailsPage.goToPatient(newPatient);
    const medicationPane = await patientDetailsPage.navigateToMedicationTab();
    const prescriptionModal = await medicationPane.openNewPrescription();

    const medicationName = await prescriptionModal.selectMedication();
    await prescriptionModal.fillClinicalDetails();
    await prescriptionModal.finalise();

    await expect(medicationPane.tableBody).toContainText(medicationName);

    await medicationRequestsPage.goto();
    await expect(medicationRequestsPage.rowForPatient(newPatient.displayId)).toBeHidden();
  });
});
