import Chance from 'chance';

const chance = new Chance();

export function createDummyAefiSurveyAnswers(overrides) {
  return {
    'dataElement/AEFI_02': chance.date({ string: true, year: 2021 }),
    'dataElement/AEFI_03': chance.date({ string: true, year: 2021 }),
    'dataElement/AEFI_04': chance.sentence(),
    'dataElement/AEFI_06': chance.pickone(['Yes', 'No']),
    'dataElement/AEFI_07': chance.pickone(['Yes', 'No']),
    'dataElement/AEFI_08': chance.pickone(['Yes', 'No']),
    'dataElement/AEFI_09': chance.pickone(['Yes', 'No']),
    'dataElement/AEFI_10': chance.pickone(['Yes', 'No']),
    'dataElement/AEFI_11': chance.integer({ min: 0, max: 365 }),
    'dataElement/AEFI_12': chance.pickone(['Yes', 'No']),
    'dataElement/AEFI_13': chance.pickone(['Yes', 'No']),
    'dataElement/AEFI_14': chance.sentence(),
    'dataElement/AEFI_15': chance.sentence(),
    'dataElement/AEFI_16': chance.paragraph(),
    'dataElement/AEFI_17': chance.pickone(['Yes', 'No']),
    'dataElement/AEFI_18': chance.sentence(),
    'dataElement/AEFI_19': chance.pickone(['Yes', 'No']),
    'dataElement/AEFI_20': chance.date({ string: true, year: 2021 }),
    'dataElement/AEFI_21': chance.bool(),
    'dataElement/AEFI_22': chance.pickone(['Yes', 'No']),
    'dataElement/AEFI_24': chance.phone(),
    'dataElement/AEFI_25': chance.email(),
    ...overrides,
  };
}

export function createDummyAefiProgramDataElements() {
  return [
    { id: 'dataElement/AEFI_02', code: 'AEFI_02', name: 'dataElement/AEFI_02', type: 'FreeText' },
    { id: 'dataElement/AEFI_03', code: 'AEFI_03', name: 'dataElement/AEFI_03', type: 'FreeText' },
    { id: 'dataElement/AEFI_04', code: 'AEFI_04', name: 'dataElement/AEFI_04', type: 'FreeText' },
    { id: 'dataElement/AEFI_06', code: 'AEFI_06', name: 'dataElement/AEFI_06', type: 'FreeText' },
    { id: 'dataElement/AEFI_07', code: 'AEFI_07', name: 'dataElement/AEFI_07', type: 'FreeText' },
    { id: 'dataElement/AEFI_08', code: 'AEFI_08', name: 'dataElement/AEFI_08', type: 'FreeText' },
    { id: 'dataElement/AEFI_09', code: 'AEFI_09', name: 'dataElement/AEFI_09', type: 'FreeText' },
    { id: 'dataElement/AEFI_10', code: 'AEFI_10', name: 'dataElement/AEFI_10', type: 'FreeText' },
    { id: 'dataElement/AEFI_11', code: 'AEFI_11', name: 'dataElement/AEFI_11', type: 'FreeText' },
    { id: 'dataElement/AEFI_12', code: 'AEFI_12', name: 'dataElement/AEFI_12', type: 'FreeText' },
    { id: 'dataElement/AEFI_13', code: 'AEFI_13', name: 'dataElement/AEFI_13', type: 'FreeText' },
    { id: 'dataElement/AEFI_14', code: 'AEFI_14', name: 'dataElement/AEFI_14', type: 'FreeText' },
    { id: 'dataElement/AEFI_15', code: 'AEFI_15', name: 'dataElement/AEFI_15', type: 'FreeText' },
    { id: 'dataElement/AEFI_16', code: 'AEFI_16', name: 'dataElement/AEFI_16', type: 'FreeText' },
    { id: 'dataElement/AEFI_17', code: 'AEFI_17', name: 'dataElement/AEFI_17', type: 'FreeText' },
    { id: 'dataElement/AEFI_18', code: 'AEFI_18', name: 'dataElement/AEFI_18', type: 'FreeText' },
    { id: 'dataElement/AEFI_19', code: 'AEFI_19', name: 'dataElement/AEFI_19', type: 'FreeText' },
    { id: 'dataElement/AEFI_20', code: 'AEFI_20', name: 'dataElement/AEFI_20', type: 'FreeText' },
    { id: 'dataElement/AEFI_21', code: 'AEFI_21', name: 'dataElement/AEFI_21', type: 'FreeText' },
    { id: 'dataElement/AEFI_22', code: 'AEFI_22', name: 'dataElement/AEFI_22', type: 'FreeText' },
    { id: 'dataElement/AEFI_24', code: 'AEFI_24', name: 'dataElement/AEFI_24', type: 'FreeText' },
    { id: 'dataElement/AEFI_25', code: 'AEFI_25', name: 'dataElement/AEFI_25', type: 'FreeText' },
  ];
}

export function createDummyAefiSurveyScreenComponent() {
  return [
    { dataElementId: 'dataElement/AEFI_02', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_03', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_04', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_06', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_07', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_08', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_09', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_10', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_11', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_12', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_13', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_14', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_15', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_16', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_17', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_18', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_19', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_20', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_21', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_22', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_24', surveyId: 'program-aefi/survey-aefi_immunisation' },
    { dataElementId: 'dataElement/AEFI_25', surveyId: 'program-aefi/survey-aefi_immunisation' },
  ];
}
