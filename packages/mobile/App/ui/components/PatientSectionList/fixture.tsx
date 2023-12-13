import { groupEntriesByLetter } from '/helpers/list';
import { StyledView } from '/styled/common';
import React from 'react';
import { IPatient } from '~/types';
import { PatientSectionList } from './index';

import { generatePatient } from '~/dummyData/patients';

export const genPatientSectionList = (): IPatient[] =>
  new Array(80).fill(1).map(() => generatePatient());

export const data: IPatient[] = genPatientSectionList();

export function BaseStory(): JSX.Element {
  return (
    <StyledView flex={1} width="100%">
      <StyledView height="20%" width="100%" />
      <PatientSectionList
        onPressItem={(patient): void => console.log(patient)}
        patients={data}
      />
    </StyledView>
  );
}
