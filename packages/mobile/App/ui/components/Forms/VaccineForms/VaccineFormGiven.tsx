import React from 'react';
import { View } from 'react-native';
import { useFormikContext } from 'formik';

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

export const VaccineFormGiven = ({ navigation }: VaccineFormProps): JSX.Element => {
  const { values } = useFormikContext();

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

      <ConsentField />

      <ConsentGivenByField />
    </StyledView>
  );
};
