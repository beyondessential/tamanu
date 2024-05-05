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
import { parseISO } from 'date-fns';
import { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import { useSelector } from 'react-redux';
import { PatientStateProps } from '~/ui/store/ducks/patient';

export const VaccineFormNotGiven = ({ navigation }: VaccineFormProps): JSX.Element => {
  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );
  return (
    <StyledView paddingTop={10}>
      <DateGivenField
        label={
          <TranslatedText stringId="vaccine.form.dateRecorded.label" fallback="Date recorded" />
        }
        min={selectedPatient?.dateOfBirth ? parseISO(selectedPatient.dateOfBirth) : undefined}
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
};
