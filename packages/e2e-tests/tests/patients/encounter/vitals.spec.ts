import { test, expect } from '@fixtures/baseFixture';
import { extractEncounterIdFromUrl } from '../../../utils/testHelper';

//TODO: can find validationCriteria for all fields in survey_screen_components table of database
//search for pde-PatientVitals to find all relevant data elements then sort by validation_criteria
//TODO: seems like above also shows where normal range is defined

async function generateTestData() {
  const generateRandomNumber = (min: number, max: number, {useDecimal = false}: {useDecimal?: boolean} = {}) => {
    const randomValue = Math.random() * (max - min) + min;
    //TODO: remove toString if change type to number
    if (useDecimal) {
    return (Math.round(randomValue * 100) / 100).toString();
    }
    else {
      return Math.round(randomValue).toString();
    }
  };
  const height = generateRandomNumber(0, 250);
  const weight = generateRandomNumber(0, 250);
  const SBP = generateRandomNumber(90, 120);
  const DBP = generateRandomNumber(60, 80);
  const heartRate = generateRandomNumber(120, 185);
  const respiratoryRate = generateRandomNumber(1, 70);
  const temperature = generateRandomNumber(32, 44, {useDecimal: true});
  const spo2 = generateRandomNumber(97, 100);
  const spo2Oxygen = generateRandomNumber(97, 100);
  const AVPUOptions = ['Alert', 'Verbal', 'Pain', 'Unresponsive'] as const;
  const AVPU = AVPUOptions[Math.floor(Math.random() * AVPUOptions.length)];
  const TEW = generateRandomNumber(0, 10);
  const GCS = generateRandomNumber(3, 15);
  const painScale = generateRandomNumber(0, 10);
  const capillaryRefillTime = generateRandomNumber(1, 4);
  const randomBGL = generateRandomNumber(1, 10);
  const fastingBGL = generateRandomNumber(1, 10);
  const ventilatorLitresPerMinute = generateRandomNumber(1, 10);
  const ventilatorModeOptions = ['SIMV VC', 'SIMV PC', 'AC VC', 'AC PC',  'AC PRVC', 'BiLevel VG', 'SBT', 'NIV'] as const;
  const ventilatorMode = ventilatorModeOptions[Math.floor(Math.random() * ventilatorModeOptions.length)];
  const FIO2 = generateRandomNumber(1, 10);
  const PIP = generateRandomNumber(1, 10);
  const PEEP = generateRandomNumber(1, 10);
  const Rate = generateRandomNumber(1, 10);
  const iTime = generateRandomNumber(1, 10);
  const tVolume = generateRandomNumber(1, 10);
  const mVLitresPerMinute = generateRandomNumber(1, 10);

  return {
    height,
    weight,
    SBP,
    DBP,
    heartRate,
    respiratoryRate,
    temperature,
    spo2,
    spo2Oxygen,
    AVPU,
    TEW,
    GCS,
    painScale,
    capillaryRefillTime,
    randomBGL,
    fastingBGL,
    ventilatorLitresPerMinute,
    ventilatorMode,
    FIO2,
    PIP,
    PEEP,
    Rate,
    iTime,
    tVolume,
    mVLitresPerMinute,
  };
}

//TODO: validation while recording vitals (mins maxs etc)
//TODO: validate when out of threshholds
//TODO: is the chart part of this (when you click the upwards icon next to measure)?
//TODO: BMI is auto calculated
test.describe('Vitals', () => {
  
  test.beforeEach(async ({newPatientWithHospitalAdmission, patientDetailsPage}) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToVitals();
  });
  //TODO: refactor this to a real test later
  test('test1', async ({vitalsPane, api}) => {

   const encounterId = extractEncounterIdFromUrl(vitalsPane.page.url());
    if (!encounterId) {
      throw new Error('Encounter ID not found');
    }

    //TODO: delete this if replaced by random test data
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

    await vitalsPane.clickRecordVitalsButton();;
    const vitalRenameThisOne = await vitalsPane.recordVitalsModal?.recordVitals(api, encounterId, await generateTestData());
    console.log(vitalRenameThisOne);

    await vitalsPane.assertVitals(vitalRenameThisOne!);


    //TODO: delete below vital, just used for testing
    await vitalsPane.page.waitForTimeout(1000);
    await vitalsPane.clickRecordVitalsButton();
    const vitalTwo = await vitalsPane.recordVitalsModal?.recordVitals(api, encounterId, {height: '186', painScale: '0'});
    console.log('vitalTwo', vitalTwo);
    await vitalsPane.assertVitals(vitalTwo!);

    await expect(vitalsPane.recordVitalsButton!).toBeVisible();
  });
});