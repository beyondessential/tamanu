import { Chance } from 'chance';
import { BloodTypes, GenderOptions } from '/helpers/constants';
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
  const sex: any = (chance.bool() ? GenderOptions[0] : GenderOptions[1]).value;
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
    sex,
    dateOfBirth: chance.birthday(),
  };
};
