import { test, expect } from '@fixtures/baseFixture';
import {
  createEncounterPrescriptionViaApi,
  createHospitalAdmissionEncounterViaAPI,
  getDrugSuggestions,
} from '@utils/apiHelpers';

// Drafts shipped in 2.26 and were then unreachable for over a year without anything noticing,
// because no test drove the form from saving through to resuming. These cover that loop.
test.describe('Discharge draft', () => {
  test('A part-filled discharge can be saved and resumed', async ({
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const [drug] = await getDrugSuggestions(api, 1);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id, undefined, {
      medicationId: drug.id,
    });

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();

    // Nothing saved yet, so no draft is waiting.
    await expect(patientDetailsPage.dischargeDraftTag).toBeHidden();

    await patientDetailsPage.prepareDischargeButton.click();
    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();

    await dischargeModal.dischargeNoteTextarea.fill('Follow up with the clinic in a fortnight');
    await dischargeModal.setDispensingQuantity(prescription.id, 12);
    await dischargeModal.sendToPharmacyCheckbox(prescription.id).uncheck();

    await dischargeModal.saveAndExit();

    // Saving a draft must not discharge the patient: the encounter stays open, and the clinician
    // stays on it rather than being sent back to the patient view.
    await expect(patientDetailsPage.prepareDischargeButton).toBeVisible();
    await expect(patientDetailsPage.dischargeDraftTag).toBeVisible();

    await patientDetailsPage.prepareDischargeButton.click();
    await dischargeModal.waitForModalToLoad();

    await expect(dischargeModal.dischargeNoteTextarea).toHaveValue(
      'Follow up with the clinic in a fortnight',
    );
    await expect(dischargeModal.dispensingQuantityInput(prescription.id)).toHaveValue('12');
    await expect(dischargeModal.sendToPharmacyCheckbox(prescription.id)).not.toBeChecked();
  });

  test('A resumed draft can be finalised, and does not outlive the discharge', async ({
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const [drug] = await getDrugSuggestions(api, 1);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id, undefined, {
      medicationId: drug.id,
    });

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();
    await dischargeModal.dischargeNoteTextarea.fill('Discharged home, stable');
    await dischargeModal.setDispensingQuantity(prescription.id, 6);
    await dischargeModal.saveAndExit();

    await patientDetailsPage.prepareDischargeButton.click();
    await dischargeModal.waitForModalToLoad();
    await dischargeModal.finaliseDischarge();

    // The discharge has happened, so the encounter offers its summary and no draft remains.
    await expect(patientDetailsPage.dischargeDraftTag).toBeHidden();
  });

  test('Returning from the unsaved-changes screen keeps the form usable', async ({
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const [drug] = await getDrugSuggestions(api, 1);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id, undefined, {
      medicationId: drug.id,
    });

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();
    await dischargeModal.dischargeNoteTextarea.fill('Changed my mind about leaving');
    await dischargeModal.setDispensingQuantity(prescription.id, 4);

    await dischargeModal.cancelAndReturnToForm();

    // What was entered survives the detour.
    await expect(dischargeModal.dischargeNoteTextarea).toHaveValue(
      'Changed my mind about leaving',
    );

    // And the discharge can still be finalised: the unsaved-changes screen must not remain in
    // place of the confirm step, which is what made this unreachable the first time round.
    await dischargeModal.finaliseDischarge();
    await expect(patientDetailsPage.dischargeSummaryButton).toBeVisible();
  });

  test('An untouched discharge form closes without asking', async ({
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();

    await dischargeModal.cancelButton.click();
    await dischargeModal.waitForModalToClose();

    await expect(patientDetailsPage.dischargeDraftTag).toBeHidden();
  });

  test('An edited discharge can be left without saving a draft', async ({
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const [drug] = await getDrugSuggestions(api, 1);
    await createEncounterPrescriptionViaApi(api, encounter.id, undefined, {
      medicationId: drug.id,
    });

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();
    await dischargeModal.dischargeNoteTextarea.fill('Typed then thought better of it');

    await dischargeModal.cancelAndDiscardChanges();

    await expect(patientDetailsPage.prepareDischargeButton).toBeVisible();
    await expect(patientDetailsPage.dischargeDraftTag).toBeHidden();
  });
});
