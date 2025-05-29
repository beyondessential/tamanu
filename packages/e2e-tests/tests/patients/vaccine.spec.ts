import { test, expect } from '@fixtures/baseFixture';

test.describe('Vaccines', () => {
  test('Add a vaccine', async ({ newPatient, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToVaccineTab();
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();
    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.recordVaccine(true, 'Routine');
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();
    expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(1);
  });
});
