import { test, expect } from '@fixtures/baseFixture';

test.describe('Vaccines', () => {
  test('Add a vaccine', async ({ newPatient, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToVaccineTab();
    await patientDetailsPage.patientVaccinePane?.recordVaccineButton.click();
    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();
  });
});
