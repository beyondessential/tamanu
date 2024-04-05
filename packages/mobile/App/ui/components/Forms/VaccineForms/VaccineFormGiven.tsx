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
import { useLocalisation } from '~/ui/contexts/LocalisationContext';

export const VaccineFormGiven = ({ navigation }: VaccineFormProps): JSX.Element => {
  const { values } = useFormikContext();
  const { getLocalisation } = useLocalisation();

  const vaccineConsentEnabled = getLocalisation('features.enableVaccineConsent');

  return (
    <StyledView paddingTop={10}>
      <DateGivenField required={!values.givenElsewhere} />

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
