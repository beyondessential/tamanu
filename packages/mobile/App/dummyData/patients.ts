import { Chance } from 'chance';
import { GenderOptions } from '/helpers/constants';
import { BloodTypes } from '/helpers/constants';

const chance = new Chance();

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

export const generatePatient = () => {
  const sex = (chance.bool() ? GenderOptions[0] : GenderOptions[1]).value;
  const [firstName, middleName, lastName] = chance
    .name({middle: true, gender: sex })
    .split(' ');
  return {
    id: chance.guid({version: 4}),
    displayId: chance.string({
      symbols: false,
      length: 6,
      casing: 'upper',
      numeric: true,
      alpha: true,
    }),
    firstName,
    middleName,
    lastName,
    culturalName: chance.bool() ? "" : chance.name(),
    bloodType: chance.pickone(BloodTypes).value,
    telephone: chance.phone(),
    sex,
    dateOfBirth: chance.birthday(),
    city: chance.pickone(CITIES),
  };
};

