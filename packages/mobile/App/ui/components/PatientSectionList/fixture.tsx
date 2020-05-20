import React from 'react';
import { groupEntriesByLetter } from '/helpers/list';
import { StyledView } from '/styled/common';
import { PatientSectionList } from './index';
import { PatientModel } from '../../models/Patient';
import { Chance } from 'chance';
import { GenderOptions } from '/helpers/constants';

const chance = new Chance();

export const genPatientSectionList = (): PatientModel[] =>
  new Array(80).fill(1).map(data => {
    const [firstName, middleName, lastName] = chance
      .name({ middle: true })
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
      city: chance.city(),
      firstName,
      middleName,
      lastName,
      gender: GenderOptions[0].value,
      birthDate: chance.birthday(),
    };
  });

export const data: PatientModel[] = genPatientSectionList();

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
