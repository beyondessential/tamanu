import React from 'react';
import { groupEntriesByLetter } from '/helpers/list';
import { StyledView } from '/styled/common';
import { PatientSectionList } from './index';
import { IPatient } from '~/types';
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

function generatePatient(): IPatient {
    const gender = (chance.bool() ? GenderOptions[0] : GenderOptions[1]).value;
    const [firstName, middleName, lastName] = chance
      .name({middle: true, gender })
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
      bloodType: chance.pickone(BloodTypes).value,
      lastVisit: chance.date(),
      telephone: chance.phone(),
      gender,
      dateOfBirth: chance.birthday(),
      city: chance.pickone(CITIES),
    };
}

export const genPatientSectionList = (): IPatient[] => new Array(80).fill(1).map(generatePatient);

export const data: IPatient[] = genPatientSectionList();

const sortedData = groupEntriesByLetter(data);

export function BaseStory(): JSX.Element {
  return (
    <StyledView flex={1} width="100%">
      <StyledView height="20%" width="100%" />
      <PatientSectionList
        onPressItem={(patient): void => console.log(patient)}
        data={sortedData}
      />
    </StyledView>
  );
}
