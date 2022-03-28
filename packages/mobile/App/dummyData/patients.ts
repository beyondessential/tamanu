import { Chance } from 'chance';
import { sample } from 'lodash';
import { GenderOptions, BloodTypes } from '/helpers/constants';
import { IPatient } from '~/types';

const defaultGenerator = new Chance();

const nameOptionsForGender = (gender: string): {} | { gender: 'male' | 'female' } => {
  // the library we're using doesn't have a list of names for other genders
  if (gender === 'male' || gender === 'female') {
    return { gender };
  };
  return {};
};

export const generatePatient = (generator = defaultGenerator): IPatient => {
  const gender = sample(Object.values(GenderOptions)).value;
  const [firstName, middleName, lastName] = generator
    .name({ middle: true, ...nameOptionsForGender(gender) })
    .split(' ');
  return {
    id: generator.guid({ version: 4 }),
    displayId: generator.string({
      symbols: false,
      length: 6,
      casing: 'upper',
      numeric: true,
      alpha: true,
    }),
    firstName,
    middleName,
    lastName,
    culturalName: generator.bool() ? '' : generator.name(),
    bloodType: generator.pickone(BloodTypes).value,
    sex: gender,
    dateOfBirth: generator.birthday(),
  };
};
