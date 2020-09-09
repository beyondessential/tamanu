import { Chance } from 'chance';
import { Gender, BloodTypes } from '/helpers/constants';
import { IPatient } from '~/types';

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

export const generatePatient = (): IPatient => {
  const sex = (chance.bool() ? Gender[0] : Gender[1]).value;
  const [firstName, middleName, lastName] = chance
    .name({ middle: true, gender: sex })
    .split(' ');
  return {
    id: chance.guid({ version: 4 }),
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
    culturalName: chance.bool() ? '' : chance.name(),
    bloodType: chance.pickone(BloodTypes).value,
    telephone: chance.phone(),
    sex,
    dateOfBirth: chance.birthday(),
    city: chance.pickone(CITIES),
  };
};
