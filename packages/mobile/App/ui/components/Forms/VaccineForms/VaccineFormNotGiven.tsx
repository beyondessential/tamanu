import React from 'react';
import { StyledView } from '/styled/common';

import {
  DateGivenField,
  DepartmentField,
  GivenByField,
  VaccineLocationField,
  RecordedByField,
  NotGivenReasonField,
} from './VaccineCommonFields';
import { VaccineFormProps } from './types';

export const VaccineFormNotGiven = ({ navigation }: VaccineFormProps): JSX.Element => (
  <StyledView paddingTop={10}>
    <DateGivenField label="Date recorded" />

    <NotGivenReasonField />

    <VaccineLocationField navigation={navigation} />

    <DepartmentField navigation={navigation} />

    <GivenByField label="Supervising clinician" />

    <RecordedByField />
  </StyledView>
);
