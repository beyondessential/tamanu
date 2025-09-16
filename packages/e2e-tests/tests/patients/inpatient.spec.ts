import { testData } from '@utils/testData';
import { test } from '../../fixtures/baseFixture';
import { getUser } from '../../utils/apiHelpers';

test.describe('inpatient table search', () => {
  test.beforeEach(async ({ inpatientsPage }) => {
    await inpatientsPage.goto();
  });
test.describe('inpatient table search', () => {
  test('Search by NHN', async ({ newPatientWithHospitalAdmission, inpatientsPage }) => {
    const patientDisplayId = newPatientWithHospitalAdmission.displayId;
    await inpatientsPage.searchTable({ NHN: patientDisplayId, advancedSearch: false });
    await inpatientsPage.validateOneSearchResult();
    await inpatientsPage.validateFirstRowContainsNHN(patientDisplayId);
  });
  test('Search by first name', async ({ newPatientWithHospitalAdmission, inpatientsPage }) => {
    const patientFirstName = newPatientWithHospitalAdmission.firstName;
    await inpatientsPage.searchTable({ firstName: patientFirstName, advancedSearch: false });
    await inpatientsPage.validateAtLeastOneSearchResult();
    await inpatientsPage.validateAllRowsContain(patientFirstName!, 'firstName');
  });
  test('Search by last name', async ({ newPatientWithHospitalAdmission, inpatientsPage }) => {
    const patientLastName = newPatientWithHospitalAdmission.lastName;
    await inpatientsPage.searchTable({ lastName: patientLastName, advancedSearch: false });
    await inpatientsPage.validateAtLeastOneSearchResult();
    await inpatientsPage.validateAllRowsContain(patientLastName!, 'lastName');
  });
  test('Search by area', async ({
    newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    inpatientsPage,
  }) => {
    const patientArea = testData.areaName;
    await inpatientsPage.searchTable({ area: patientArea, advancedSearch: false });
    await inpatientsPage.validateAtLeastOneSearchResult();
    await inpatientsPage.validateAllRowsContain(patientArea, 'locationGroupName');
  });
  test('Search by department', async ({
    newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    inpatientsPage,
  }) => {
    const patientDepartment = testData.departmentName;
    await inpatientsPage.searchTable({ department: patientDepartment, advancedSearch: true });
    await inpatientsPage.validateAtLeastOneSearchResult();
    await inpatientsPage.validateAllRowsContain(patientDepartment, 'departmentName');
  });
  test('Search by clinician', async ({
    newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    inpatientsPage,
    api,
  }) => {
    const currentUser = await getUser(api);
    const patientClinician = currentUser.displayName;
    await inpatientsPage.searchTable({ clinician: patientClinician, advancedSearch: true });
    await inpatientsPage.validateAtLeastOneSearchResult();
    await inpatientsPage.validateAllRowsContain(patientClinician, 'clinician');
  });
  test('Search by first selected diet', async ({
    newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    inpatientsPage,
  }) => {
    const patientDiet = testData.dietName;
    await inpatientsPage.searchTable({ diet: patientDiet, advancedSearch: true });
    await inpatientsPage.validateAtLeastOneSearchResult();
    await inpatientsPage.validateAllRowsContain(testData.dietSearchResult1, 'diets');
  });
  test('Search by second selected diet', async ({
    newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    inpatientsPage,
  }) => {
    await inpatientsPage.searchTable({ diet: testData.dietName2, advancedSearch: true });
    await inpatientsPage.validateAtLeastOneSearchResult();
    await inpatientsPage.validateAllRowsContain(testData.dietSearchResult2, 'diets');
  });
  test('Search by filling all the fields', async ({
    newPatientWithHospitalAdmission,
    inpatientsPage,
    api,
  }) => {
    const currentUser = await getUser(api);
    await inpatientsPage.searchTable({
      NHN: newPatientWithHospitalAdmission.displayId,
      firstName: newPatientWithHospitalAdmission.firstName,
      lastName: newPatientWithHospitalAdmission.lastName,
      area: testData.areaName,
      department: testData.departmentName,
      clinician: currentUser.displayName,
      diet: testData.dietName,
      advancedSearch: true,
    });
    await inpatientsPage.validateOneSearchResult();
    await inpatientsPage.validateFirstRowContainsNHN(newPatientWithHospitalAdmission.displayId);
    await inpatientsPage.validateAllRowsContain(testData.areaName, 'locationGroupName');
    await inpatientsPage.validateAllRowsContain(testData.departmentName, 'departmentName');
    await inpatientsPage.validateAllRowsContain(currentUser.displayName, 'clinician');
    await inpatientsPage.validateAllRowsContain(testData.dietSearchResult1, 'diets');
    });
  });
});
