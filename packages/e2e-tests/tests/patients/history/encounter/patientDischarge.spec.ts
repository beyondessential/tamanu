import { test, expect } from '@fixtures/baseFixture';
import {
  createEncounterPrescriptionViaApi,
  createHospitalAdmissionEncounterViaAPI,
  getDrugSuggestions,
  getPractitioners,
  getUser,
} from '@utils/apiHelpers';

test.describe('Patient discharge', () => {
  test('Only the medications selected on discharge are sent to pharmacy', async ({
    api,
    newPatient,
    patientDetailsPage,
    medicationRequestsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    // Distinct drugs so the two medications can be told apart in the active medications table.
    const [sentDrug, notSentDrug] = await getDrugSuggestions(api, 2);
    const sentPrescription = await createEncounterPrescriptionViaApi(api, encounter.id, undefined, {
      medicationId: sentDrug.id,
    });
    const notSentPrescription = await createEncounterPrescriptionViaApi(
      api,
      encounter.id,
      undefined,
      { medicationId: notSentDrug.id },
    );

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();

    // Encounter medications start unselected until the clinician chooses to send them.
    await expect(dischargeModal.sendToPharmacyCheckbox(sentPrescription.id)).not.toBeChecked();
    await expect(dischargeModal.sendToPharmacyCheckbox(notSentPrescription.id)).not.toBeChecked();
    await dischargeModal.sendToPharmacyCheckbox(sentPrescription.id).check();

    // A dispensing quantity is required of the medication being sent. The one left behind is given
    // a quantity too, so that what reaches pharmacy is what was selected rather than what was
    // filled in — prescriptions are created without a quantity.
    await dischargeModal.setDispensingQuantity(sentPrescription.id, 12);
    await dischargeModal.setDispensingQuantity(notSentPrescription.id, 8);

    await dischargeModal.finaliseDischarge();

    // Only the medication left selected is waiting to be dispensed.
    await medicationRequestsPage.goto();
    const patientRows = medicationRequestsPage.rowForPatient(newPatient.displayId);
    await expect(patientRows).toHaveCount(1);
    await expect(patientRows).toContainText(sentDrug.name);
    await expect(patientRows).not.toContainText(notSentDrug.name);
  });

  // The discharge itself must still work where nothing is being ordered — the form sends the same
  // medications payload either way, and its validation gates every discharge.
  test('A discharge that sends nothing to pharmacy still finalises', async ({
    api,
    newPatient,
    patientDetailsPage,
    medicationRequestsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id);

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();

    // Left unselected, as it starts by default: nothing is being sent to pharmacy here.
    await dischargeModal.setDispensingQuantity(prescription.id, 5);
    await dischargeModal.finaliseDischarge();

    // A discharged encounter offers its summary in place of the discharge action.
    await patientDetailsPage.navigateToFirstEncounter();
    await expect(patientDetailsPage.dischargeSummaryButton).toBeVisible();

    await expect(medicationRequestsPage.rowForPatient(newPatient.displayId)).toHaveCount(0);
  });

  // The reported regression: a medication left out of the pharmacy order has nothing to dispense,
  // so its quantity needs no value of its own and the discharge still completes. The server records
  // a blank quantity as zero against the prescription.
  test('A blank dispensing quantity does not block a discharge that sends nothing to pharmacy', async ({
    api,
    newPatient,
    patientDetailsPage,
    medicationRequestsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id);

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();

    // A prescription created without a quantity is recorded as zero, so the row starts at 0 and
    // stays there: there is nothing to dispense once it is out of the pharmacy order (left
    // unselected, as it starts by default).
    await expect(dischargeModal.dispensingQuantityInput(prescription.id)).toHaveValue('0');

    await dischargeModal.finaliseDischarge();

    await patientDetailsPage.navigateToFirstEncounter();
    await expect(patientDetailsPage.dischargeSummaryButton).toBeVisible();
    await expect(medicationRequestsPage.rowForPatient(newPatient.displayId)).toHaveCount(0);
  });

  test('Finalising is blocked until a medication being sent has a dispensing quantity', async ({
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id);

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();

    // A prescription created without a quantity starts at zero. Selecting it to send is what
    // makes the dispensing quantity required.
    await dischargeModal.sendToPharmacyCheckbox(prescription.id).check();
    await dischargeModal.attemptFinaliseDischarge();
    await expect(dischargeModal.dispensingQuantityError(prescription.id)).toHaveText('*Required');

    // Zero is no dispense at all, so it is not enough for a row going to pharmacy either.
    await dischargeModal.setDispensingQuantity(prescription.id, 0);
    await dischargeModal.attemptFinaliseDischarge();
    await expect(dischargeModal.dispensingQuantityError(prescription.id)).toHaveText('*Required');

    await dischargeModal.setDispensingQuantity(prescription.id, 3);
    await dischargeModal.finaliseDischarge();

    await patientDetailsPage.navigateToFirstEncounter();
    await expect(patientDetailsPage.dischargeSummaryButton).toBeVisible();
  });

  test('Ordering prescriber is only active while a medication is selected to send', async ({
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id);

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();

    // Nothing is selected to send yet, so there is no order to attribute.
    await expect(dischargeModal.orderingPrescriberInput).toBeDisabled();

    await dischargeModal.sendToPharmacyCheckbox(prescription.id).check();
    await expect(dischargeModal.orderingPrescriberInput).toBeEnabled();

    await dischargeModal.sendToPharmacyCheckbox(prescription.id).uncheck();
    await expect(dischargeModal.orderingPrescriberInput).toBeDisabled();
  });

  // Regression guard: discontinuing a medication used to reinitialise the whole discharge form,
  // reverting the ordering prescriber the user had chosen back to the auto-populated current user.
  test('Discontinuing a medication keeps the chosen ordering prescriber and the other rows edits', async ({
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const currentUser = await getUser(api);

    // The regression is only observable by moving the prescriber off its auto-populated default,
    // which needs someone else to move it to. Some environments seed a single user.
    const practitioners = await getPractitioners(api);
    const otherPractitioners = practitioners.filter(({ name }) => name !== currentUser.displayName);
    test.skip(
      otherPractitioners.length === 0,
      'Requires a second practitioner to switch the ordering prescriber to',
    );

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    // Two distinct drugs: one to discontinue, one that must survive with its edits intact. Keeping
    // a medication listed also keeps the ordering prescriber field active after the discontinue.
    const [keptDrug, discontinuedDrug] = await getDrugSuggestions(api, 2);
    const keptPrescription = await createEncounterPrescriptionViaApi(api, encounter.id, undefined, {
      medicationId: keptDrug.id,
    });
    const discontinuedPrescription = await createEncounterPrescriptionViaApi(
      api,
      encounter.id,
      undefined,
      { medicationId: discontinuedDrug.id },
    );

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();

    // The ordering prescriber field is only active once a medication is selected to send.
    await dischargeModal.sendToPharmacyCheckbox(keptPrescription.id).check();

    // Edits the discontinue must not disturb: a prescriber other than the default, and a quantity.
    const chosenPrescriber = await dischargeModal.changeOrderingPrescriber(currentUser.displayName);
    expect(chosenPrescriber).not.toBe(currentUser.displayName);
    await dischargeModal.setDispensingQuantity(keptPrescription.id, 7);

    // "Discontinued by" is left on its own auto-populated default, as in the reported steps.
    const discontinueModal = await dischargeModal.clickDiscontinue(discontinuedPrescription.id);
    await expect(discontinueModal.discontinuedByInput).toHaveValue(currentUser.displayName);
    await discontinueModal.fillReason('No longer required on discharge');
    await discontinueModal.submit();

    // The discontinued medication drops out of the discharge, which is what refreshes the form.
    await expect(dischargeModal.medicationRow(discontinuedPrescription.id)).toHaveCount(0);

    // The regression: the prescriber silently reverted to the current user here.
    await expect(dischargeModal.orderingPrescriberInput).toHaveValue(chosenPrescriber);
    await expect(dischargeModal.dispensingQuantityInput(keptPrescription.id)).toHaveValue('7');

    // The surviving edits are what actually gets discharged.
    await dischargeModal.finaliseDischarge();
    await patientDetailsPage.navigateToFirstEncounter();
    await expect(patientDetailsPage.dischargeSummaryButton).toBeVisible();
  });
});
