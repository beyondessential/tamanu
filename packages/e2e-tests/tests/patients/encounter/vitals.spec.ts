import { test, expect } from '@fixtures/baseFixture';

test.describe('Vitals', () => {
  
  test.beforeEach(async ({newPatientWithHospitalAdmission, patientDetailsPage}) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToVitals();
  });
  test('test1', async ({vitalsPane}) => {

    const vitalRenameThisOneValues = {
      height: '185',
    }
    await vitalsPane.clickRecordVitalsButton();
    const vitalRenameThisOne = await vitalsPane.recordVitalsModal?.recordVitals(vitalRenameThisOneValues);
    console.log(vitalRenameThisOne);
    await vitalsPane.assertVitals(vitalRenameThisOne!);
    await expect(vitalsPane.recordVitalsButton!).toBeVisible();
  });
});
