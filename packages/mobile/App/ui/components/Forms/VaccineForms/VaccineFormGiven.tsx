import { useFormikContext } from 'formik';
import React from 'react';
import { View } from 'react-native';

import { StyledView } from '/styled/common';
import { VaccineFormProps } from './types';
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

export const VaccineFormGiven = ({ navigation }: VaccineFormProps): JSX.Element => {
  const { values } = useFormikContext();

  return (
    <StyledView paddingTop={10}>
      <DateGivenField required={!values.givenElsewhere} />

      <BatchField />

      <InjectionSiteField />

      {!values.givenElsewhere ?
        (
          <View>
            <VaccineLocationField navigation={navigation} />
            <DepartmentField navigation={navigation} />
          </View>
        ) :
        null}

      <GivenByField />

      <RecordedByField />

      <ConsentField />

      <ConsentGivenByField />
    </StyledView>
  );
};
