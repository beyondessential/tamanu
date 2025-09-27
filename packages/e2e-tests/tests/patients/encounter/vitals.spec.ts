import { test, expect } from '@fixtures/baseFixture';
import { extractEncounterIdFromUrl } from '../../../utils/testHelper';
import { format, subWeeks } from 'date-fns';

//TODO: validate when out of threshholds - search pde-PatientVitals in survey_screen_components table of database
//TODO: is the chart part of this (when you click the upwards icon next to measure)?
//TODO: search all TODOS, some in random places
//TODO: make the function to enable edits in CI via API more generic / cleaner
//TODO: editing even just 1 of height and/or weight etc should also auto updates the BMI and MAP, how to handle?
//TODO: test editing all vitals?
//TODO: history of edits in edit vitals modal
//TODO: modal heading (includes OG date), test for asserting that?

//TODO: move this generator function and it's type to somewhere separate?
type VitalField = 
  | 'height' | 'weight' | 'SBP' | 'DBP' | 'heartRate' | 'respiratoryRate' 
  | 'temperature' | 'spo2' | 'spo2Oxygen' | 'AVPU' | 'TEW' | 'GCS' 
  | 'painScale' | 'capillaryRefillTime' | 'randomBGL' | 'fastingBGL' 
  | 'ventilatorLitresPerMinute' | 'ventilatorMode' | 'FIO2' | 'PIP' 
  | 'PEEP' | 'Rate' | 'iTime' | 'tVolume' | 'mVLitresPerMinute';

async function generateDifferentValue(field: VitalField, exclude: string) {
    let value: string;
    do { value = (await generateTestData([field]))[field]; } 
    while (value === exclude);
    return value;
  }

async function generateTestData(specificFields?: VitalField[]) {
  const generateRandomNumber = (
    min: number,
    max: number,
    { useDecimal = false }: { useDecimal?: boolean } = {},
  ) => {
    const randomValue = Math.random() * (max - min) + min;
    //TODO: remove toString if change type to number
    if (useDecimal) {
      // Return decimal to 1 decimal place to match how it's displayed in the vitals table
      return (Math.round(randomValue * 10) / 10).toString();
    } else {
      return Math.round(randomValue).toString();
    }
  };

  const testDataConfig = {
    height: () => generateRandomNumber(1, 250),
    weight: () => generateRandomNumber(1, 250),
    SBP: () => generateRandomNumber(90, 120),
    DBP: () => generateRandomNumber(60, 80),
    heartRate: () => generateRandomNumber(120, 185),
    respiratoryRate: () => generateRandomNumber(1, 70),
    temperature: () => generateRandomNumber(32, 44, { useDecimal: true }),
    spo2: () => generateRandomNumber(97, 100),
    spo2Oxygen: () => generateRandomNumber(97, 100),
    AVPU: () => (['Alert', 'Verbal', 'Pain', 'Unresponsive'] as const)[Math.floor(Math.random() * 4)],
    TEW: () => generateRandomNumber(0, 10),
    GCS: () => generateRandomNumber(3, 15),
    painScale: () => generateRandomNumber(0, 10),
    capillaryRefillTime: () => generateRandomNumber(1, 4),
    randomBGL: () => generateRandomNumber(1, 10),
    fastingBGL: () => generateRandomNumber(1, 10),
    ventilatorLitresPerMinute: () => generateRandomNumber(1, 10),
    ventilatorMode: () => (['SIMV PC', 'AC VC', 'AC PC', 'AC PRVC', 'SBT', 'NIV'] as const)[Math.floor(Math.random() * 6)],
    FIO2: () => generateRandomNumber(1, 10),
    PIP: () => generateRandomNumber(1, 10),
    PEEP: () => generateRandomNumber(1, 10),
    Rate: () => generateRandomNumber(1, 10),
    iTime: () => generateRandomNumber(1, 10),
    tVolume: () => generateRandomNumber(1, 10),
    mVLitresPerMinute: () => generateRandomNumber(1, 10),
  };

  // If no specific fields requested, generate test data for all vitals
  if (!specificFields) {
    const result: Record<string, string> = {};
    for (const [field, generator] of Object.entries(testDataConfig)) {
      result[field] = generator();
    }
    return result;
  }

  // If specific fields requested, generate test data for only those fields
  const result: Record<string, string> = {};
  for (const field of specificFields) {
    if (field in testDataConfig) {
      result[field] = testDataConfig[field as keyof typeof testDataConfig]();
    }
  }

  return result;
}

test.describe('Vitals', () => {
  test.beforeEach(async ({ newPatientWithHospitalAdmission, patientDetailsPage, vitalsPane }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToVitals();
    const encounterId = extractEncounterIdFromUrl(vitalsPane.page.url());
    if (!encounterId) {
      throw new Error('Encounter ID not found');
    }
    vitalsPane.encounterId = encounterId;
  });

  test('Record vital with just one field filled', async ({ vitalsPane, api }) => {
    await vitalsPane.clickRecordVitalsButton();
    const vital = await vitalsPane.recordVitalsModal?.recordVitals(api, vitalsPane.encounterId!, {
      height: '185',
    });
    if (!vital) {
      throw new Error('Vital failed to be recorded');
    }
    await vitalsPane.assertVitalsTable(vital);
  });

  test('Record vital with all fields filled and assert table displays correct values', async ({
    vitalsPane,
    api,
  }) => {
    await vitalsPane.clickRecordVitalsButton();
    const vital = await vitalsPane.recordVitalsModal?.recordVitals(
      api,
      vitalsPane.encounterId!,
      await generateTestData(),
    );
    if (!vital) {
      throw new Error('Vital failed to be recorded');
    }
    await vitalsPane.assertVitalsTable(vital);
  });

  test('Record multiple vitals and assert table displays correct values', async ({
    vitalsPane,
    api,
  }) => {
    //Create and assert first vital
    await vitalsPane.clickRecordVitalsButton();
    const vitalOne = await vitalsPane.recordVitalsModal?.recordVitals(
      api,
      vitalsPane.encounterId!,
      await generateTestData(),
    );
    if (!vitalOne) {
      throw new Error('Vital failed to be recorded');
    }
    await vitalsPane.assertVitalsTable(vitalOne);

    //Create and assert second vital
    await vitalsPane.clickRecordVitalsButton();
    const vitalTwo = await vitalsPane.recordVitalsModal?.recordVitals(
      api,
      vitalsPane.encounterId!,
      await generateTestData(),
    );
    if (!vitalTwo) {
      throw new Error('Vital failed to be recorded');
    }
    await vitalsPane.assertVitalsTable(vitalTwo);
  });

  test('Calculated questions are disabled and can only be answered based on the answer to other questions', async ({
    vitalsPane,
    api,
  }) => {
    const inputData = {
      height: '185',
      weight: '70',
      SBP: '20',
      DBP: '5',
    };

    const expectedBMI = '20.5';
    const expectedMAP = '10';

    await vitalsPane.clickRecordVitalsButton();

    // Calculated questions are disabled and data cannot be entered
    await expect(vitalsPane.recordVitalsModal?.BMIField!).toBeDisabled();
    await expect(vitalsPane.recordVitalsModal?.MAPField!).toBeDisabled();

    // Answering height and weight will auto calculate the BMI
    await vitalsPane.recordVitalsModal?.confirmBMIAutoCalculation(
      inputData.height,
      inputData.weight,
      expectedBMI,
    );

    // Answering SBP and DBP will auto calculate the MAP
    await vitalsPane.recordVitalsModal?.confirmMAPAutoCalculation(
      inputData.SBP,
      inputData.DBP,
      expectedMAP,
    );

    // Calculated questions are not editable after auto calculation
    await expect(vitalsPane.recordVitalsModal?.BMIField!).toBeDisabled();
    await expect(vitalsPane.recordVitalsModal?.MAPField!).toBeDisabled();

    // Create a vital with calculated questions answered and confirm they are saved in the table
    const vital = await vitalsPane.recordVitalsModal?.recordVitals(
      api,
      vitalsPane.encounterId!,
      inputData,
    );
    if (!vital) {
      throw new Error('Vital failed to be recorded');
    }
    await vitalsPane.assertVitalsTable(vital);
  });

  test('Cannot record vitals with values outside of the defined min and max', async ({
    vitalsPane,
  }) => {
    const invalidData = {
      temperature: {
        valueBelowMin: '29',
        valueAboveMax: '77',
        belowMinError: 'Temperature (°C) must be at least 32°C',
        aboveMaxError: 'Temperature (°C) can not exceed 44°C',
      },
      GCS: {
        valueBelowMin: '2',
        valueAboveMax: '16',
        belowMinError: 'GCS must be at least 3',
        aboveMaxError: 'GCS can not exceed 15',
      },
      respiratoryRate: {
        valueBelowMin: '0',
        valueAboveMax: '71',
        belowMinError: 'Respiratory rate (bpm) must be at least 1',
        aboveMaxError: 'Respiratory rate (bpm) can not exceed 70',
      },
      capillaryRefillTime: {
        valueBelowMin: '0',
        valueAboveMax: '5',
        belowMinError: 'Capillary Refill Time must be at least 1',
        aboveMaxError: 'Capillary Refill Time can not exceed 4',
      },
      weight: {
        valueBelowMin: '-1',
        valueAboveMax: '251',
        belowMinError: 'Weight (kg) must be at least 0kg',
        aboveMaxError: 'Weight (kg) can not exceed 250kg',
      },
    };

    await vitalsPane.clickRecordVitalsButton();

    // Iterate through test data and assert the expected validation errors appear
    for (const [fieldName, data] of Object.entries(invalidData)) {
      await vitalsPane.recordVitalsModal?.assertValidationError(fieldName, data);
    }
  });

  test('Can create vital with default date', async ({vitalsPane, api}) => {
    const currentDateTime = format(new Date(), 'yyyy-MM-dd\'T\'HH:mm');

    // Does not include date so will use default date of today
    const defaultDateData = {
      height: '185',
      weight: '70',
    };

    //Confirm default date is today in record vitals modal
    await vitalsPane.clickRecordVitalsButton();
    const dateValue = await vitalsPane.recordVitalsModal?.dateField.evaluate((el: HTMLInputElement) => el.value);
    expect(dateValue).toBe(currentDateTime);

    const vital = await vitalsPane.recordVitalsModal?.recordVitals(
      api,
      vitalsPane.encounterId!,
      defaultDateData,
    );

    if (!vital) {
      throw new Error('Vital failed to be recorded');
    }

    // Assert the date in the vitals table is today's date
    expect(vital.date).toBe(currentDateTime);
    await vitalsPane.assertVitalsTable(vital);
  });

  test('Can create vital with custom date', async ({vitalsPane, api}) => {
    const dateTwoWeeksAgo = subWeeks(new Date(), 2);
    const dateTwoWeeksAgoFormatted = format(dateTwoWeeksAgo, 'yyyy-MM-dd\'T\'HH:mm');

    const customDateData = {
      height: '165',
      weight: '55',
      date: dateTwoWeeksAgoFormatted
    };

    await vitalsPane.clickRecordVitalsButton();
    const vital = await vitalsPane.recordVitalsModal?.recordVitals(
      api,
      vitalsPane.encounterId!,
      customDateData,
    );

    if (!vital) {
      throw new Error('Vital failed to be recorded');
    }

    // Assert the date in the vitals table is the custom date
    expect(vital.date).toBe(dateTwoWeeksAgoFormatted);
    await vitalsPane.assertVitalsTable(vital);
  });

  test('Edit a vital', async ({vitalsPane, api}) => {
    await vitalsPane.clickRecordVitalsButton();
    const vital = await vitalsPane.recordVitalsModal?.recordVitals(
      api,
      vitalsPane.encounterId!,
      await generateTestData(),
    );
    if (!vital) {
      throw new Error('Vital failed to be recorded');
    }

    const editedData = {
      height: await generateDifferentValue('height', vital.height!),
      weight: await generateDifferentValue('weight', vital.weight!),
    }

    const recordedVitals = await vitalsPane.assertVitalsTable(vital);

    const editedVitals = await vitalsPane.editVitals(recordedVitals, editedData);

    await vitalsPane.assertVitalsTable(editedVitals, editedData);

    //TODO: more asserts in below function, e.g. "reason for change" etc
    await vitalsPane.assertEditedVitalModal(editedVitals, editedData, recordedVitals);

  });


});
