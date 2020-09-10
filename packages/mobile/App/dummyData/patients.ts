import { Chance } from 'chance';
import { GenderOptions } from '/helpers/constants';
import { IPatient } from '~/types';

const chance = new Chance();

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
