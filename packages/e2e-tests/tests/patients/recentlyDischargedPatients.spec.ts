import { test, expect } from '@fixtures/baseFixture';
import {
  createClinicEncounterViaApi,
  createHospitalAdmissionEncounterViaAPI,
  dischargeEncounterViaApi,
  getUser,
  recordPatientDeathViaApi,
} from '@utils/apiHelpers';
import { testData } from '@utils/testData';

// spec: RDISCH
test.describe('Recently discharged patients', () => {
  test('lists a patient discharged by a clinician, opens their summary, and keeps the search on return', async ({
    api,
    newPatient,
    allPatientsPage,
    sidebarPage,
    recentlyDischargedPatientsPage,
  }) => {
    const clinician = await getUser(api);
    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    await dischargeEncounterViaApi(api, encounter.id, { dischargerId: clinician.id });

    await allPatientsPage.goto();
    await sidebarPage.clickRecentlyDischargedPatients();
    await recentlyDischargedPatientsPage.waitForPageToLoad();
    await recentlyDischargedPatientsPage.searchTable({
      NHN: newPatient.displayId,
      advancedSearch: false,
    });

    await recentlyDischargedPatientsPage.validateOneSearchResult();
    const cell = (columnKey: string) => recentlyDischargedPatientsPage.getCell(0, columnKey);
    await expect(cell('displayId')).toHaveText(newPatient.displayId);
    await expect(cell('firstName')).toHaveText(newPatient.firstName!);
    await expect(cell('lastName')).toHaveText(newPatient.lastName!);
    await expect(cell('patientStatus')).toHaveText('Inpatient');
    await expect(cell('departmentName')).toHaveText(testData.department);
    await expect(cell('clinician')).toHaveText(clinician.displayName!);

    await recentlyDischargedPatientsPage.openPatientFromRow(0, newPatient.id);

    await sidebarPage.clickRecentlyDischargedPatients();
    await expect(recentlyDischargedPatientsPage.nhnInput).toHaveValue(newPatient.displayId);
    await recentlyDischargedPatientsPage.validateOneSearchResult();
  });

  test("shows N/A for a system discharge, and colours a deceased patient's whole row red", async ({
    api,
    page,
    newPatient,
    recentlyDischargedPatientsPage,
  }) => {
    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    // No discharger, as when the system closes an encounter automatically
    await dischargeEncounterViaApi(api, encounter.id);
    await recordPatientDeathViaApi(api, page, newPatient.id);

    await recentlyDischargedPatientsPage.goto();
    await recentlyDischargedPatientsPage.searchTable({
      NHN: newPatient.displayId,
      advancedSearch: false,
    });

    await recentlyDischargedPatientsPage.validateOneSearchResult();
    await expect(recentlyDischargedPatientsPage.getCell(0, 'clinician')).toHaveText('N/A');
    await recentlyDischargedPatientsPage.validateWholeRowIsRed(0);
  });

  test('filters by encounter type and, under advanced search, department', async ({
    api,
    page,
    newPatient,
    recentlyDischargedPatientsPage,
  }) => {
    const encounter = await createClinicEncounterViaApi(api, page, newPatient.id);
    await dischargeEncounterViaApi(api, encounter.id);

    await recentlyDischargedPatientsPage.goto();
    await recentlyDischargedPatientsPage.searchTable({
      NHN: newPatient.displayId,
      encounterType: 'Inpatient',
      advancedSearch: false,
    });
    await recentlyDischargedPatientsPage.validateNoSearchResults();

    await recentlyDischargedPatientsPage.searchTable({
      encounterType: 'Outpatient',
      department: testData.department,
      advancedSearch: true,
    });
    await recentlyDischargedPatientsPage.validateOneSearchResult();
    await expect(recentlyDischargedPatientsPage.getCell(0, 'displayId')).toHaveText(
      newPatient.displayId,
    );
    await expect(recentlyDischargedPatientsPage.getCell(0, 'patientStatus')).toHaveText(
      'Outpatient',
    );
  });
});
