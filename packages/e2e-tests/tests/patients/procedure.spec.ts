import { format } from 'date-fns';

import { test, expect } from '../../fixtures/test';
import { getUser } from '../../fixtures/api';
import { toDisplayDate, toTableDate } from '@helpers/dates';
import {
  ProcedurePane,
  NewProcedureModal,
  UnsavedChangesModal,
} from '@pages/patients/ProcedurePage';

test.setTimeout(60000);

test.describe('Procedures', () => {
  test.beforeEach(async ({ newPatientWithHospitalAdmission, patientDetailsPage, page }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToProcedureTab();
    await new ProcedurePane(page).waitForPaneToLoad();
  });

  test('[T-0197][AT-0089]Validate pre-populated fields', async ({ api, page }) => {
    const user = await getUser(api);
    const procedurePane = new ProcedurePane(page);
    const modal = new NewProcedureModal(page);

    await procedurePane.newProcedureButton.click();
    const date = new Date();
    await modal.waitForModalToLoad();
    await expect(modal.getLocatorInput(modal.procedureDateInput)).toHaveValue(
      toDisplayDate(format(date, 'yyyy-MM-dd')),
    );
    await expect(modal.getLocatorInput(modal.leadClinicianInput)).toHaveValue(user.displayName!);
    // Time started defaults from facility `getCurrentDateTime()`, not the test runner clock — assert display shape only.
    await expect(modal.getLocatorInput(modal.timeStartedInput)).toHaveValue(/\d{1,2}:\d{2} (AM|PM)/);
  });

  test('[T-0197][AT-0090]Add a procedure with all fields filled and validate the procedure table', async ({
    page,
    newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
  }) => {
    const procedurePane = new ProcedurePane(page);
    const modal = new NewProcedureModal(page);

    await procedurePane.newProcedureButton.click();
    const procedureData = await modal.fillAllFields();
    await modal.saveProcedureButton.click();
    await modal.waitForModalToClose();
    await procedurePane.waitForTableToLoad();
    await expect(procedurePane.table.getRowCount()).resolves.toBe(1);
    await expect(procedurePane.cell(0, 'ProcedureType.name')).toHaveText(procedureData.procedure);
    await expect(procedurePane.cell(0, 'date')).toHaveText(toTableDate(new Date()));
  });

  test('[T-0197][AT-0091]Add a procedure with only required fields and validate the procedure table', async ({
    page,
    newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
  }) => {
    const procedurePane = new ProcedurePane(page);
    const modal = new NewProcedureModal(page);

    await procedurePane.newProcedureButton.click();
    const procedureData = await modal.fillRequiredFields();
    await modal.saveProcedureButton.click();
    await modal.waitForModalToClose();
    await procedurePane.waitForTableToLoad();
    await expect(procedurePane.table.getRowCount()).resolves.toBe(1);
    await expect(procedurePane.cell(0, 'ProcedureType.name')).toHaveText(procedureData.procedure);
    await expect(procedurePane.cell(0, 'date')).toHaveText(toTableDate(new Date()));
  });

  test('[T-0197][AT-0092]Add multiple procedures and validate the procedure table', async ({ page }) => {
    const procedurePane = new ProcedurePane(page);
    const modal = new NewProcedureModal(page);
    const numberOfProcedures = 3;

    for (let i = 0; i < numberOfProcedures; i++) {
      await procedurePane.newProcedureButton.click();
      const procedureData = await modal.fillRequiredFields();
      await modal.saveProcedureButton.click();
      await modal.waitForModalToClose();
      await procedurePane.waitForTableToLoad();
      await expect(procedurePane.cell(i, 'ProcedureType.name')).toHaveText(procedureData.procedure);
      await expect(procedurePane.cell(i, 'date')).toHaveText(toTableDate(new Date()));
    }
    await expect(procedurePane.table.getRowCount()).resolves.toBe(numberOfProcedures);
  });

  test('[AT-0093]Add procedure and view procedure record', async ({ page }) => {
    const procedurePane = new ProcedurePane(page);
    const modal = new NewProcedureModal(page);

    await procedurePane.newProcedureButton.click();
    const procedureData = await modal.fillAllFields();
    await modal.saveProcedureButton.click();
    await procedurePane.waitForTableToLoad();
    await procedurePane.table.rows.first().click();
    const viewModal = new NewProcedureModal(page);
    await viewModal.waitForModalToLoad();
    await expect(viewModal.getLocatorInput(viewModal.procedureInput)).toHaveValue(procedureData.procedure);
    await expect(viewModal.getLocatorInput(viewModal.procedureDateInput)).toHaveValue(
      toDisplayDate(format(new Date(), 'yyyy-MM-dd')),
    );
    await expect(viewModal.getLocatorInput(viewModal.procedureAreaInput)).toHaveValue(procedureData.area);
    await expect(viewModal.getLocatorInput(viewModal.procedureLocationInput)).toHaveValue(
      procedureData.location,
    );
    await expect(viewModal.getLocatorInput(viewModal.departmentInput)).toHaveValue(procedureData.department);
    await expect(viewModal.getLocatorInput(viewModal.anaesthetistInput)).toHaveValue(procedureData.anaesthetist);
    await expect(viewModal.getLocatorInput(viewModal.assistantAnaesthetistInput)).toHaveValue(
      procedureData.assistantAnaesthetist,
    );
    await expect(viewModal.getLocatorInput(viewModal.anaestheticTypeInput)).toHaveValue(
      procedureData.anaestheticType,
    );
    await expect(viewModal.getLocatorInput(viewModal.timeInInput)).toHaveValue(procedureData.timeIn);
    await expect(viewModal.getLocatorInput(viewModal.timeOutInput)).toHaveValue(procedureData.timeOut);
    await expect(viewModal.getLocatorInput(viewModal.timeStartedInput)).toHaveValue(procedureData.timeStarted);
    await expect(viewModal.getLocatorInput(viewModal.timeEndedInput)).toHaveValue(procedureData.timeEnded);
    await expect(viewModal.notesInput).toHaveValue(procedureData.notes);
    await expect(viewModal.completedCheckbox).toBeChecked();
    await expect(viewModal.completedNotesInput).toHaveValue(procedureData.completedNotes);
  });

  test('[AT-0094]Discard procedure creation', async ({ page }) => {
    const procedurePane = new ProcedurePane(page);
    const modal = new NewProcedureModal(page);
    const unsavedChangesModal = new UnsavedChangesModal(page);

    await procedurePane.newProcedureButton.click();
    await modal.waitForModalToLoad();
    await modal.fillAllFields();
    await modal.cancelButton.click();
    await unsavedChangesModal.waitForModalToLoad();
    await unsavedChangesModal.discardButton.click();
    await unsavedChangesModal.waitForModalToClose();
    await expect(procedurePane.table.body.locator('tr').first().locator('td').first()).toHaveText(
      'No data found',
    );
  });

  test('[AT-0095]Continue editing while cancelling procedure creation', async ({ page }) => {
    const procedurePane = new ProcedurePane(page);
    const modal = new NewProcedureModal(page);
    const unsavedChangesModal = new UnsavedChangesModal(page);

    await procedurePane.newProcedureButton.click();
    await modal.waitForModalToLoad();
    const procedureData = await modal.fillAllFields();
    await modal.cancelButton.click();
    await unsavedChangesModal.waitForModalToLoad();
    await unsavedChangesModal.continueButton.click();
    await expect(modal.getLocatorInput(modal.procedureInput)).toHaveValue(procedureData.procedure);
    await expect(modal.getLocatorInput(modal.procedureDateInput)).toHaveValue(
      toDisplayDate(format(new Date(), 'yyyy-MM-dd')),
    );
    await expect(modal.getLocatorInput(modal.procedureAreaInput)).toHaveValue(procedureData.area);
    await expect(modal.getLocatorInput(modal.procedureLocationInput)).toHaveValue(procedureData.location);
    await expect(modal.getLocatorInput(modal.departmentInput)).toHaveValue(procedureData.department);
    await expect(modal.getLocatorInput(modal.anaesthetistInput)).toHaveValue(procedureData.anaesthetist);
    await expect(modal.getLocatorInput(modal.assistantAnaesthetistInput)).toHaveValue(
      procedureData.assistantAnaesthetist,
    );
    await expect(modal.getLocatorInput(modal.anaestheticTypeInput)).toHaveValue(procedureData.anaestheticType);
    await expect(modal.getLocatorInput(modal.timeInInput)).toHaveValue(procedureData.timeIn);
    await expect(modal.getLocatorInput(modal.timeOutInput)).toHaveValue(procedureData.timeOut);
    await expect(modal.getLocatorInput(modal.timeStartedInput)).toHaveValue(procedureData.timeStarted);
    await expect(modal.getLocatorInput(modal.timeEndedInput)).toHaveValue(procedureData.timeEnded);
    await expect(modal.notesInput).toHaveValue(procedureData.notes);
    await expect(modal.completedCheckbox).toBeChecked();
    await expect(modal.completedNotesInput).toHaveValue(procedureData.completedNotes);
  });
});
