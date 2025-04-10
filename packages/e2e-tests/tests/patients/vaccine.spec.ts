import { routes, wildcardToRegex } from '../../config/routes';
import { expect, test } from '../../fixtures/baseFixture';

test.describe('Vaccines', () => {
  test.describe('Record a Routine / Catchup / Campaign vaccine', () => {
    test('Record a Routine vaccine', async ({ allPatientsPage, patientDetailsPage }) => {
      await allPatientsPage.goto();
      await allPatientsPage.clickOnFirstRow();

      // Patient details page should load
      await expect(patientDetailsPage.page).toHaveURL(
        wildcardToRegex(routes.patients.patientDetails),
      );

      // Click on the vaccines tab
      const vaccinePane = await patientDetailsPage.navigateToVaccineTab();

      // Store current recorded vaccines count
      const recordedVaccinesCount = await vaccinePane.getRecordedVaccineCount();

      // Record vaccine
      const recordVaccineModal = await vaccinePane.clickRecordVaccineButton();

      // TODO - change to Routine specific vaccine
      await recordVaccineModal.recordRandomVaccine();
      await recordVaccineModal.waitForModalToClose();

      const newRecordedVaccinesCount = await vaccinePane.getRecordedVaccineCount();
      expect(newRecordedVaccinesCount).toBe(recordedVaccinesCount + 1);
    });
  });
});
