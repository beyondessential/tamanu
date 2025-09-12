import { test, expect } from '@fixtures/baseFixture';
import { extractEncounterIdFromUrl } from '../../../utils/testHelper';

//TODO: can find validationCriteria for all fields in survey_screen_components table of database
//search for pde-PatientVitals to find all relevant data elements then sort by validation_criteria
//TODO: seems like above also shows where normal range is defined
//TODO: search all TODOS, some in random places

async function generateTestData() {
  const generateRandomNumber = (min: number, max: number, {useDecimal = false}: {useDecimal?: boolean} = {}) => {
    const randomValue = Math.random() * (max - min) + min;
    //TODO: remove toString if change type to number
    if (useDecimal) {
      // Return decimal to 1 decimal place to match how it's displayed in the vitals table
      return (Math.round(randomValue * 10) / 10).toString();
    }
    else {
      return Math.round(randomValue).toString();
    }
  };
  const height = generateRandomNumber(1, 250);
  const weight = generateRandomNumber(1, 250);
  const SBP = generateRandomNumber(90, 120);
  const DBP = generateRandomNumber(60, 80);
  const heartRate = generateRandomNumber(120, 185);
  const respiratoryRate = generateRandomNumber(1, 70);
  const temperature = generateRandomNumber(32, 44, {useDecimal: true});
  const spo2 = generateRandomNumber(97, 100);
  const spo2Oxygen = generateRandomNumber(97, 100);
  const AVPUOptions = ['Verbal', 'Unresponsive'] as const;
  const AVPU = AVPUOptions[Math.floor(Math.random() * AVPUOptions.length)];
  const TEW = generateRandomNumber(0, 10);
  const GCS = generateRandomNumber(3, 15);
  const painScale = generateRandomNumber(0, 10);
  const capillaryRefillTime = generateRandomNumber(1, 4);
  const randomBGL = generateRandomNumber(1, 10);
  const fastingBGL = generateRandomNumber(1, 10);
  const ventilatorLitresPerMinute = generateRandomNumber(1, 10);
  const ventilatorModeOptions = ['SIMV PC', 'AC VC', 'AC PC',  'AC PRVC', 'SBT', 'NIV'] as const;
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
//TODO: search all TODOS, some in random places
test.describe('Vitals', () => {
  
  test.beforeEach(async ({newPatientWithHospitalAdmission, patientDetailsPage, vitalsPane}) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToVitals();
    const encounterId = extractEncounterIdFromUrl(vitalsPane.page.url());
    if (!encounterId) {
      throw new Error('Encounter ID not found');
    }
    vitalsPane.encounterId = encounterId;
  });
  
  test('Record vital with just one field filled', async ({vitalsPane, api}) => {
    await vitalsPane.clickRecordVitalsButton();
    const vital = await vitalsPane.recordVitalsModal?.recordVitals(api, vitalsPane.encounterId!, {height: '185'});
    if (!vital) {
      throw new Error('Vital failed to be recorded');
    }
    await vitalsPane.assertVitals(vital);
  });

  test('Record vital with all fields filled and assert table displays correct values', async ({vitalsPane, api}) => {
    await vitalsPane.clickRecordVitalsButton();
    const vital = await vitalsPane.recordVitalsModal?.recordVitals(api, vitalsPane.encounterId!, await generateTestData());
    if (!vital) {
      throw new Error('Vital failed to be recorded');
    }
    await vitalsPane.assertVitals(vital);
  });

  test('Record multiple vitals and assert table displays correct values', async ({vitalsPane, api}) => {
    //Create and assert first vital
    await vitalsPane.clickRecordVitalsButton();
    const vitalOne = await vitalsPane.recordVitalsModal?.recordVitals(api, vitalsPane.encounterId!, await generateTestData());
    if (!vitalOne) {
      throw new Error('Vital failed to be recorded');
    }
    await vitalsPane.assertVitals(vitalOne);

    //Create and assert second vital
    await vitalsPane.clickRecordVitalsButton();
    const vitalTwo = await vitalsPane.recordVitalsModal?.recordVitals(api, vitalsPane.encounterId!, await generateTestData());
    if (!vitalTwo) {
      throw new Error('Vital failed to be recorded');
    }
    await vitalsPane.assertVitals(vitalTwo);
  });
});