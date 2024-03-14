import React from 'react';
import { View } from 'react-native';
import { useFormikContext } from 'formik';

import { StyledView } from '/styled/common';
import {
  BatchField,
  ConsentField,
  ConsentGivenByField,
  DateGivenField,
  DepartmentField,
  GivenByField,
  InjectionSiteField,
  RecordedByField,
  VaccineLocationField,
} from './VaccineCommonFields';
import { VaccineFormProps } from './types';
import { useSelector } from 'react-redux';
import { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import { PatientStateProps } from '~/ui/store/ducks/patient';

export const VaccineFormGiven = ({ navigation }: VaccineFormProps): JSX.Element => {
  const { values } = useFormikContext();
  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );

  return (
    <StyledView paddingTop={10}>
      <DateGivenField required={!values.givenElsewhere} min={selectedPatient?.dateOfBirth ? new Date(selectedPatient.dateOfBirth) : undefined} />

      <BatchField />

      <InjectionSiteField />

      {!values.givenElsewhere ? (
        <View>
          <VaccineLocationField navigation={navigation} />
          <DepartmentField navigation={navigation} />
        </View>
      ) : null}

      <GivenByField />

      <RecordedByField />

      <ConsentField />

      <ConsentGivenByField />
    </StyledView>
  );
};
