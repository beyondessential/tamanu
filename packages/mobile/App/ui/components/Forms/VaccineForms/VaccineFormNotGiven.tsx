import { StyledView } from '/styled/common';
import React from 'react';

import { VaccineFormProps } from './types';
import {
  DateGivenField,
  DepartmentField,
  GivenByField,
  NotGivenReasonField,
  RecordedByField,
  VaccineLocationField,
} from './VaccineCommonFields';

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
