import React from 'react';
import { StyledView } from '/styled/common';

import {
  DateGivenField,
  DepartmentField,
  GivenByField,
  NotGivenReasonField,
  RecordedByField,
  VaccineLocationField,
} from './VaccineCommonFields';
import { VaccineFormProps } from './types';
import { TranslatedText } from '../../Translations/TranslatedText';

export const VaccineFormNotGiven = ({ navigation }: VaccineFormProps): JSX.Element => (
  <StyledView paddingTop={10}>
    <DateGivenField
      label={<TranslatedText stringId="vaccine.form.dateRecorded.label" fallback="Date recorded" />}
    />

    <NotGivenReasonField />

    <VaccineLocationField navigation={navigation} />

    <DepartmentField navigation={navigation} />

    <GivenByField
      label={
        <TranslatedText
          stringId="vaccine.form.supervisingClinician.label"
          fallback="Supervising clinician"
        />
      }
    />

    <RecordedByField />
  </StyledView>
);
