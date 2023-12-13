import { PatientPersonalInfoForm } from '/components/Forms/NewPatientForm/PatientPersonalInfoForm';
import { FullView } from '/styled/common';
import { theme } from '/styled/theme';
import { useNavigation } from '@react-navigation/native';
import React, { ReactElement, useCallback } from 'react';
import { StatusBar } from 'react-native';
import { StackHeader } from '~/ui/components/StackHeader';

export const EditPatientScreen = ({ route }): ReactElement => {
  const navigation = useNavigation();
  const { patientName } = route.params;
  const onGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <StatusBar barStyle="light-content" />
      <StackHeader title="Edit Patient" subtitle={patientName} onGoBack={onGoBack} />
      <PatientPersonalInfoForm isEdit />
    </FullView>
  );
};
