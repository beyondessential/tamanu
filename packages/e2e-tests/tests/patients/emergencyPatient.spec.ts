import { test } from '../../fixtures/baseFixture';

test.describe('Emergency patients', () => {
  test.beforeEach(async ({ emergencyPatientsPage }) => {
    await emergencyPatientsPage.goto();
  });

  test.describe('search', () => {
    test('Search by Patient ID', async ({ newPatientWithTriageAdmission, emergencyPatientsPage }) => {
      await emergencyPatientsPage.searchTable({
        displayId: newPatientWithTriageAdmission.displayId,
        advancedSearch: false,
      });
      await emergencyPatientsPage.validateOneSearchResult();
      await emergencyPatientsPage.validateFirstRowContainsDisplayId(
        newPatientWithTriageAdmission.displayId,
      );
    });

    test('Search by first and last name', async ({
      newPatientWithTriageAdmission,
      emergencyPatientsPage,
    }) => {
      await emergencyPatientsPage.searchTable({
        firstName: newPatientWithTriageAdmission.firstName,
        lastName: newPatientWithTriageAdmission.lastName,
        advancedSearch: false,
      });
      await emergencyPatientsPage.validateOneSearchResult();
      await emergencyPatientsPage.validateFirstRowContainsDisplayId(
        newPatientWithTriageAdmission.displayId,
      );
    });
  });
});
