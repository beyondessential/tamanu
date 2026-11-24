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
import type { VaccineFormProps } from './types';
import { TranslatedText } from '../../Translations/TranslatedText';
import { parseISO } from 'date-fns';
import { useSelectedPatient } from '~/ui/contexts/SelectedPatientContext';

export const VaccineFormNotGiven = ({ navigation }: VaccineFormProps) => {
  const { selectedPatient } = useSelectedPatient();
  return (
    <StyledView paddingTop={10}>
      <DateGivenField
        label={
          <TranslatedText stringId="vaccine.form.dateRecorded.label" fallback="Date recorded" />
        }
        min={selectedPatient?.dateOfBirth ? parseISO(selectedPatient.dateOfBirth) : undefined}
        max={new Date()}
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
