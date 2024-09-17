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
import { parseISO } from 'date-fns';
import { useSettings } from '~/ui/contexts/SettingsContext';


export const VaccineFormGiven = ({ navigation }: VaccineFormProps): JSX.Element => {
  const { values } = useFormikContext();
  const { getSetting } = useSettings()

  const vaccineConsentEnabled = getSetting<boolean>('features.enableVaccineConsent');

  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );

  return (
    <StyledView paddingTop={10}>
      <DateGivenField
        required={!values.givenElsewhere}
        min={selectedPatient?.dateOfBirth ? parseISO(selectedPatient.dateOfBirth) : undefined}
        max={new Date()}
      />

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

      {vaccineConsentEnabled && (
        <>
          <ConsentField />
          <ConsentGivenByField />
        </>
      )}
    </StyledView>
  );
};
