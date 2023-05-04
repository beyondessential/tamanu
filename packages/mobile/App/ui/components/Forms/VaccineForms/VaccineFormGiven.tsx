import React from 'react';
import { NavigationProp } from '@react-navigation/native';

import { StyledView } from '/styled/common';
import {
  DateGivenField,
  DepartmentField,
  GivenByField,
  VaccineLocationField,
  RecordedByField,
  ConsentField,
  ConsentGivenByField,
  BatchField,
  InjectionSiteField,
} from './VaccineCommonFields';
import { VaccineFormProps } from './types';

export const VaccineFormGiven = ({ navigation }: VaccineFormProps): JSX.Element => (
  <StyledView paddingTop={10}>
    <DateGivenField />

    <BatchField />

    <InjectionSiteField />

    <VaccineLocationField navigation={navigation} />

    <DepartmentField navigation={navigation} />

    <GivenByField />

    <RecordedByField />

    <ConsentField />

    <ConsentGivenByField />
  </StyledView>
);
