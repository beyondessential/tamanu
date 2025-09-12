import { test, expect } from '@fixtures/baseFixture';
import { extractEncounterIdFromUrl } from '../../../utils/testHelper';

//TODO: validation while recording vitals (mins maxs etc)
//TODO: validate when out of threshholds
//TODO: is the chart part of this (when you click the upwards icon next to measure)?
//TODO: BMI is auto calculated
test.describe('Vitals', () => {
  
  test.beforeEach(async ({newPatientWithHospitalAdmission, patientDetailsPage}) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToVitals();
  });
  test('test1', async ({vitalsPane, api}) => {

   const encounterId = extractEncounterIdFromUrl(vitalsPane.page.url());
    if (!encounterId) {
      throw new Error('Encounter ID not found');
    }

    const vitalRenameThisOneValues = {
      height: '1',
      weight: '2',
      SBP: '3',
      DBP: '4',
      heartRate: '5',
      respiratoryRate: '6',
      temperature: '32',
      spo2: '8',
      spo2Oxygen: '9',
      TEW: '10',
      GCS: '11',
      painScale: '1',
      capillaryRefillTime: '2',
      randomBGL: '14',
      fastingBGL: '15',
      ventilatorLitresPerMinute: '16',
      FIO2: '17',
      PIP: '18',
      PEEP: '19',
      Rate: '20',
      iTime: '21',
      tVolume: '22',
      mVLitresPerMinute: '23',
    }

    await vitalsPane.clickRecordVitalsButton();
    const vitalRenameThisOne = await vitalsPane.recordVitalsModal?.recordVitals(api, encounterId, vitalRenameThisOneValues);
    console.log(vitalRenameThisOne);

    await vitalsPane.assertVitals(vitalRenameThisOne!);


    //TODO: delete below vital, just used for testing
    await vitalsPane.page.waitForTimeout(1000);
    await vitalsPane.clickRecordVitalsButton();
    const vitalTwo = await vitalsPane.recordVitalsModal?.recordVitals(api, encounterId, {height: '186'});
    console.log('vitalTwo', vitalTwo);
    await vitalsPane.assertVitals(vitalTwo!);

    await expect(vitalsPane.recordVitalsButton!).toBeVisible();
  });
});