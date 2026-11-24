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
import type { VaccineFormProps } from './types';
import { useSelectedPatient } from '~/ui/contexts/SelectedPatientContext';
import { parseISO } from 'date-fns';
import { useSettings } from '~/ui/contexts/SettingsContext';

export const VaccineFormGiven = ({ navigation }: VaccineFormProps) => {
  const { values } = useFormikContext();
  const { getSetting } = useSettings();

  const vaccineConsentEnabled = getSetting<boolean>('features.enableVaccineConsent');

  const { selectedPatient } = useSelectedPatient();

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
