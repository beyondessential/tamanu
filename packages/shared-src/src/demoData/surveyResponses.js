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
