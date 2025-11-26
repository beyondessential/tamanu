import { test, expect } from '@fixtures/baseFixture';
import { getUser } from '@utils/apiHelpers';
import { format } from 'date-fns';

test.setTimeout(60000);

test.describe('Procedures', () => {
  test.beforeEach(async ({ newPatientWithHospitalAdmission, patientDetailsPage }) => {
    
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToProcedureTab();
  });
  
  test('[T-0197][AT-0089]Validate pre-populated fields', async ({ api,patientDetailsPage }) => {
    const user = await getUser(api);
    await patientDetailsPage.patientProcedurePane?.newProcedureButton.click();
    const date = new Date();
    const modal = patientDetailsPage.patientProcedurePane!.getNewProcedureModal();
    await modal.waitForModalToLoad();
    await expect(modal.getLocatorInput(modal.procedureDateInput)).toHaveValue(format(date, 'yyyy-MM-dd'));
    await expect(modal.getLocatorInput(modal.leadClinicianInput)).toHaveValue(user.displayName!);
    await expect(modal.getLocatorInput(modal.timeStartedInput)).toHaveValue(format(date, 'HH:mm'));
  });

  test('[T-0197][AT-0090]Add a procedure with all fields filled and validate the procedure table', async ({ patientDetailsPage, newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission }) => {
    await patientDetailsPage.patientProcedurePane?.newProcedureButton.click();
    const modal = patientDetailsPage.patientProcedurePane!.getNewProcedureModal();
    const procedureData = await modal.fillAllFields();
    await modal.saveProcedureButton.click();
    await modal.waitForModalToClose();
    await patientDetailsPage.patientProcedurePane?.waitForTableToLoad();
    await expect(patientDetailsPage.patientProcedurePane?.getRecordedProcedureCount()).resolves.toBe(1);
    await expect(patientDetailsPage.patientProcedurePane!.getTableCell(0, 2)).toHaveText(procedureData?.procedure!);
    await expect(patientDetailsPage.patientProcedurePane!.getTableCell(0, 0)).toHaveText(format(new Date(), 'MM/dd/yyyy'));
  });

  test('[T-0197][AT-0091]Add a procedure with only required fields and validate the procedure table', async ({ patientDetailsPage, newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission }) => {
    await patientDetailsPage.patientProcedurePane?.newProcedureButton.click();
    const modal = patientDetailsPage.patientProcedurePane!.getNewProcedureModal();
    const procedureData = await modal.fillRequiredFields();
    await modal.saveProcedureButton.click();
    await modal.waitForModalToClose();
    await patientDetailsPage.patientProcedurePane?.waitForTableToLoad();
    await expect(patientDetailsPage.patientProcedurePane?.getRecordedProcedureCount()).resolves.toBe(1);
    await expect(patientDetailsPage.patientProcedurePane!.getTableCell(0, 2)).toHaveText(procedureData?.procedure!);
    await expect(patientDetailsPage.patientProcedurePane!.getTableCell(0, 0)).toHaveText(format(new Date(), 'MM/dd/yyyy'));
  });

  test('[T-0197][AT-0092]Add multiple procedures and validate the procedure table', async ({ patientDetailsPage }) => {
    const numberOfProcedures = 3;
   for (let i = 0; i < numberOfProcedures; i++) {
    await patientDetailsPage.patientProcedurePane?.newProcedureButton.click();
    const modal = patientDetailsPage.patientProcedurePane!.getNewProcedureModal();
    const procedureData = await modal.fillRequiredFields();
    await modal.saveProcedureButton.click();
    await modal.waitForModalToClose();
    await patientDetailsPage.patientProcedurePane?.waitForTableToLoad();
      await expect(patientDetailsPage.patientProcedurePane!.getTableCell(i, 2)).toHaveText(procedureData?.procedure!);
      await expect(patientDetailsPage.patientProcedurePane!.getTableCell(i, 0)).toHaveText(format(new Date(), 'MM/dd/yyyy'));
    }
    await expect(patientDetailsPage.patientProcedurePane?.getRecordedProcedureCount()).resolves.toBe(numberOfProcedures);
  });

  test('[AT-0093]Add procedure and view procedure record', async ({ patientDetailsPage }) => {
    await patientDetailsPage.patientProcedurePane?.newProcedureButton.click();
    const modal = patientDetailsPage.patientProcedurePane!.getNewProcedureModal();
    const procedureData = await modal.fillAllFields();
    await modal.saveProcedureButton.click();
    await patientDetailsPage.patientProcedurePane?.waitForTableToLoad();
    await patientDetailsPage.patientProcedurePane?.getFirstTableRow().click();
    const viewModal = patientDetailsPage.patientProcedurePane!.getNewProcedureModal();
    await viewModal.waitForModalToLoad();
    await expect(viewModal.getLocatorInput(viewModal.procedureInput)).toHaveValue(procedureData.procedure!);
    await expect(viewModal.getLocatorInput(viewModal.procedureDateInput)).toHaveValue(format(new Date(), 'yyyy-MM-dd'));
    await expect(viewModal.getLocatorInput(viewModal.procedureAreaInput)).toHaveValue(procedureData.area!);
    await expect(viewModal.getLocatorInput(viewModal.procedureLocationInput)).toHaveValue(procedureData.location!);
    await expect(viewModal.getLocatorInput(viewModal.departmentInput)).toHaveValue(procedureData.department!);
    await expect(viewModal.getLocatorInput(viewModal.anaesthetistInput)).toHaveValue(procedureData.anaesthetist!);
    await expect(viewModal.getLocatorInput(viewModal.assistantAnaesthetistInput)).toHaveValue(procedureData.assistantAnaesthetist!);
    await expect(viewModal.getLocatorInput(viewModal.anaestheticTypeInput)).toHaveValue(procedureData.anaestheticType!);
    await expect(viewModal.getLocatorInput(viewModal.timeInInput)).toHaveValue(procedureData.timeIn!);
    await expect(viewModal.getLocatorInput(viewModal.timeOutInput)).toHaveValue(procedureData.timeOut);
    await expect(viewModal.getLocatorInput(viewModal.timeStartedInput)).toHaveValue(procedureData.timeStarted);
    await expect(viewModal.getLocatorInput(viewModal.timeEndedInput)).toHaveValue(procedureData.timeEnded);
    await expect(viewModal.notesInput).toHaveValue(procedureData.notes);
    await expect(viewModal.completedCheckbox).toBeChecked();
    await expect(viewModal.completedNotesInput).toHaveValue(procedureData.completedNotes);
  });

  test('[AT-0094]Discard procedure creation', async ({ patientDetailsPage }) => {
    await patientDetailsPage.patientProcedurePane?.newProcedureButton.click();
    const modal = patientDetailsPage.patientProcedurePane!.getNewProcedureModal();
    await modal.waitForModalToLoad();
    await modal.fillAllFields();
    await modal.cancelButton.click();
    await modal.getUnsavedChangesModal().waitForModalToLoad();
    await modal.getUnsavedChangesModal().discardChangesButton.click();
    await modal.getUnsavedChangesModal().waitForModalToClose();
    await expect(patientDetailsPage.patientProcedurePane!.getNoDataFoundText()).resolves.toBe('No data found');
  });

  test('[AT-0095]Continue editing while cancelling procedure creation', async ({ patientDetailsPage }) => {
    await patientDetailsPage.patientProcedurePane?.newProcedureButton.click();
    const modal = patientDetailsPage.patientProcedurePane!.getNewProcedureModal();
    await modal.waitForModalToLoad();
   const procedureData = await modal.fillAllFields();
    await modal.cancelButton.click();
    await modal.getUnsavedChangesModal().waitForModalToLoad();
    await modal.getUnsavedChangesModal().continueEditingButton.click();
    await expect(modal.getLocatorInput(modal.procedureInput)).toHaveValue(procedureData.procedure!);
    await expect(modal.getLocatorInput(modal.procedureDateInput)).toHaveValue(format(new Date(), 'yyyy-MM-dd'));
    await expect(modal.getLocatorInput(modal.procedureAreaInput)).toHaveValue(procedureData.area!);
    await expect(modal.getLocatorInput(modal.procedureLocationInput)).toHaveValue(procedureData.location!);
    await expect(modal.getLocatorInput(modal.departmentInput)).toHaveValue(procedureData.department!);
    await expect(modal.getLocatorInput(modal.anaesthetistInput)).toHaveValue(procedureData.anaesthetist!);
    await expect(modal.getLocatorInput(modal.assistantAnaesthetistInput)).toHaveValue(procedureData.assistantAnaesthetist!);
    await expect(modal.getLocatorInput(modal.anaestheticTypeInput)).toHaveValue(procedureData.anaestheticType!);
    await expect(modal.getLocatorInput(modal.timeInInput)).toHaveValue(procedureData.timeIn!);
    await expect(modal.getLocatorInput(modal.timeOutInput)).toHaveValue(procedureData.timeOut);
    await expect(modal.getLocatorInput(modal.timeStartedInput)).toHaveValue(procedureData.timeStarted);
    await expect(modal.getLocatorInput(modal.timeEndedInput)).toHaveValue(procedureData.timeEnded);
    await expect(modal.notesInput).toHaveValue(procedureData.notes);
    await expect(modal.completedCheckbox).toBeChecked();
    await expect(modal.completedNotesInput).toHaveValue(procedureData.completedNotes);
  });


});
