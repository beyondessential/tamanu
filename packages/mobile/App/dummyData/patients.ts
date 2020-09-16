import { Chance } from 'chance';
import { GenderOptions } from '/helpers/constants';
import { BloodTypes } from '/helpers/constants';

const defaultGenerator = new Chance();

const CITIES = [
  'Melbourne',
  'Adelaide',
  'Hobart',
  'Sydney',
  'Brisbane',
  'Darwin',
  'Perth',
  'Canberra',
];

export const generatePatient = (generator = defaultGenerator) => {
  const sex = (generator.bool() ? GenderOptions[0] : GenderOptions[1]).value;
  const [firstName, middleName, lastName] = generator
    .name({middle: true, gender: sex })
    .split(' ');
  return {
    id: generator.guid({version: 4}),
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
    culturalName: generator.bool() ? "" : generator.name(),
    bloodType: generator.pickone(BloodTypes).value,
    sex,
    dateOfBirth: generator.birthday(),
    // city: generator.pickone(CITIES),
    // telephone: generator.phone(),
  };
};

