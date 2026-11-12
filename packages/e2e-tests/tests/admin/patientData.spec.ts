import { test, expect } from '../../fixtures/baseFixture';

const PATIENT_DATA_TYPES = ['administeredVaccine', 'patient'];

// Admin panel auth is included in the shared storageState via auth.setup.ts.
test.describe('Admin panel patient data', () => {
  test('Opens on the import tab with every patient data type selected', async ({
    patientDataAdminPage,
  }) => {
    await patientDataAdminPage.goto();

    await expect(patientDataAdminPage.importTab).toHaveAttribute('aria-selected', 'true');
    await expect(patientDataAdminPage.selectAllCheckbox).toBeChecked();
    for (const dataType of PATIENT_DATA_TYPES) {
      await expect(patientDataAdminPage.dataTypeCheckbox(dataType)).toBeChecked();
    }
  });

  test('Exports every patient data type', async ({ patientDataAdminPage }) => {
    await patientDataAdminPage.stubSaveFilePicker();
    await patientDataAdminPage.goto();
    await patientDataAdminPage.exportTab.click();

    for (const dataType of PATIENT_DATA_TYPES) {
      await expect(patientDataAdminPage.dataTypeCheckbox(dataType)).toBeChecked();
    }

    const exportResponse = await patientDataAdminPage.exportSelectedDataTypes();
    expect(exportResponse.ok()).toBe(true);
    const exportUrl = decodeURIComponent(exportResponse.url());
    for (const dataType of PATIENT_DATA_TYPES) {
      expect(exportUrl).toContain(dataType);
    }
    await expect(patientDataAdminPage.downloadSuccessToast).toBeVisible();
  });

  test('Patient data types are not offered on the reference data view', async ({
    referenceDataAdminPage,
  }) => {
    await referenceDataAdminPage.goto();
    await referenceDataAdminPage.importTab.click();

    // A reference data type confirms the list has rendered before checking for absences
    await expect(referenceDataAdminPage.dataTypeCheckbox('allergy')).toBeVisible();
    for (const dataType of PATIENT_DATA_TYPES) {
      await expect(referenceDataAdminPage.dataTypeCheckbox(dataType)).toHaveCount(0);
    }
  });
});
