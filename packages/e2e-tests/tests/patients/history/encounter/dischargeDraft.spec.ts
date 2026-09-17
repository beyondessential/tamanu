import { APIRequestContext } from '@playwright/test';
import { addDays, format } from 'date-fns';

import { test, expect } from '@fixtures/baseFixture';
import {
  createEncounterPrescriptionViaApi,
  createHospitalAdmissionEncounterViaAPI,
  getDrugSuggestions,
  getUser,
} from '@utils/apiHelpers';
import { constructFacilityUrl } from '@utils/navigation';

/**
 * The clinician's saved draft, read straight from the API.
 *
 * The "Draft" tag is not a proxy for this: a discharged encounter renders the discharged action
 * row and disables the draft query, so the tag is absent whether or not the draft was cleared.
 */
const getDischargeDraft = async (api: APIRequestContext, encounterId: string) => {
  const response = await api.get(
    constructFacilityUrl(`/api/encounter/${encounterId}/dischargeDraft`),
  );
  if (!response.ok()) {
    throw new Error(`Failed to fetch discharge draft: ${response.status()}`);
  }
  const { draft } = await response.json();
  return draft;
};

/** A discharge planning note on the encounter, the kind the treatment plan field seeds from. */
const createDischargePlanningNote = async (
  api: APIRequestContext,
  encounterId: string,
  authorId: string,
  content: string,
) => {
  const response = await api.post(constructFacilityUrl('/api/notes'), {
    data: {
      recordId: encounterId,
      recordType: 'Encounter',
      noteTypeId: 'notetype-discharge',
      authorId,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      content,
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to create planning note: ${response.status()}`);
  }
};

const getDischarge = async (api: APIRequestContext, encounterId: string) => {
  const response = await api.get(constructFacilityUrl(`/api/encounter/${encounterId}/discharge`));
  if (!response.ok()) {
    throw new Error(`Failed to fetch discharge: ${response.status()}`);
  }
  return response.json();
};

// Drafts shipped in 2.26 and were then unreachable for over a year without anything noticing,
// because no test drove the form from saving through to resuming. These cover that loop.
// Skipped while the discharge draft workflow is hidden: its entry points are gated behind
// IS_DISCHARGE_DRAFT_ENABLED in packages/web/app/forms/dischargeDraft.js, which is false pending
// Product design on tracking edits to the discharge planning note (Workhorse card A8). The
// coverage below is kept whole so it comes back with the flag rather than being rewritten.
test.describe.skip('Discharge draft', () => {
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

    // The date, clinician and disposition all come back from the draft rather than being
    // regenerated from live defaults, so they are set to something distinguishable first. The
    // field will not accept anything before the admission, which was just made, so the date has
    // to sit after it rather than at some fixed point in the past.
    const dischargeDate = `${format(addDays(new Date(), 1), 'yyyy-MM-dd')}T09:30`;
    await dischargeModal.setDischargeDate(dischargeDate);
    const dischargingClinician = await dischargeModal.selectDischargingClinician();
    const disposition = await dischargeModal.selectDisposition();

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

    await dischargeModal.expectDischargeDate(dischargeDate);
    // The autocompletes show a label resolved from the stored id, so matching the label the
    // clinician picked also proves the id itself round-tripped.
    await expect(dischargeModal.dischargingClinicianInput).toHaveValue(dischargingClinician);
    await expect(dischargeModal.dispositionInput).toHaveValue(disposition);
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

    await expect(patientDetailsPage.dischargeSummaryButton).toBeVisible();

    // What was resumed is what got discharged.
    const discharge = await getDischarge(api, encounter.id);
    expect(discharge.note).toEqual('Discharged home, stable');

    // Asserted through the API rather than the tag, which is absent on a discharged encounter
    // whether or not the draft was actually cleared.
    expect(await getDischargeDraft(api, encounter.id)).toBeNull();
  });

  test('A planning note written after the draft is appended, not duplicated', async ({
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const user = await getUser(api);
    await createDischargePlanningNote(api, encounter.id, user.id, 'Planned before the draft');

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();

    // The field seeds from the planning notes recorded during the admission.
    await expect(dischargeModal.dischargeNoteTextarea).toHaveValue(/Planned before the draft/);

    await dischargeModal.dischargeNoteTextarea.fill('My own wording');
    await dischargeModal.saveAndExit();

    // A colleague adds a planning note while the discharge is part-finished.
    await createDischargePlanningNote(api, encounter.id, user.id, 'Added by a colleague');

    await patientDetailsPage.prepareDischargeButton.click();
    await dischargeModal.waitForModalToLoad();

    // The clinician's own wording survives, the new note is appended, and the note already
    // folded in before the draft was saved does not come back a second time.
    const resumed = await dischargeModal.dischargeNoteTextarea.inputValue();
    expect(resumed).toContain('My own wording');
    expect(resumed).toContain('Added by a colleague');
    expect(resumed).not.toContain('Planned before the draft');
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

  test('Discarding clears a draft that had already been saved', async ({
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
    await dischargeModal.dischargeNoteTextarea.fill('Saved, then thought better of it');
    await dischargeModal.saveAndExit();
    await expect(patientDetailsPage.dischargeDraftTag).toBeVisible();

    // Discarding has to clear the saved draft, not just close the form on an unsaved edit.
    await patientDetailsPage.prepareDischargeButton.click();
    await dischargeModal.waitForModalToLoad();
    await dischargeModal.dischargeNoteTextarea.fill('Second thoughts');
    await dischargeModal.cancelAndDiscardChanges();

    await expect(patientDetailsPage.prepareDischargeButton).toBeVisible();
    await expect(patientDetailsPage.dischargeDraftTag).toBeHidden();
    expect(await getDischargeDraft(api, encounter.id)).toBeNull();
  });
});
