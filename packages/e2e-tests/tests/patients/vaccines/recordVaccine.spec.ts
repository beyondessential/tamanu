import { test, expect } from '../../../fixtures/baseFixture';
import { routes, wildcardToRegex } from '../../../config/routes';

test('Record a vaccine', async ({ allPatientsPage, patientDetailsPage }) => {
  await allPatientsPage.goto();
  await allPatientsPage.clickOnFirstRow();

  // Patient details page should load
  await expect(patientDetailsPage.page).toHaveURL(wildcardToRegex(routes.patients.patientDetails));

  // Click on the vaccines tab
  const vaccinePane = await patientDetailsPage.navigateToVaccineTab();

  // Store current recorded vaccines count
  const recordedVaccinesCount = await vaccinePane.getRecordedVaccineCount();

  // Record vaccine
  const recordVaccineModal = await vaccinePane.clickRecordVaccineButton();
  await recordVaccineModal.recordRandomVaccine();
  await recordVaccineModal.waitForModalToClose();

  const newRecordedVaccinesCount = await vaccinePane.getRecordedVaccineCount();
  expect(newRecordedVaccinesCount).toBe(recordedVaccinesCount + 1);
});
