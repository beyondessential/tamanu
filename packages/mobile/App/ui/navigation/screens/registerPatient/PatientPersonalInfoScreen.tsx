import { PatientPersonalInfoForm } from '/components/Forms/NewPatientForm/PatientPersonalInfoForm';
import { Routes } from '/helpers/routes';
import { FullView } from '/styled/common';
import { theme } from '/styled/theme';
import React, { ReactElement, useCallback } from 'react';
import { StatusBar } from 'react-native';
import { PatientSectionHeader } from '~/ui/components/Forms/NewPatientForm/PatientSectionHeader';
import { PatientPersonalInfoScreenProps } from '../../../interfaces/screens/RegisterPatientStack/PatientPersonalInfoScreen';
import { Header } from './CommonComponents/Header';

export const PatientPersonalInfoScreen = ({
  navigation,
}: PatientPersonalInfoScreenProps): ReactElement => {
  const onGoBack = useCallback(() => {
    navigation.navigate(Routes.HomeStack.HomeTabs.Index);
  }, []);

  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <StatusBar barStyle="light-content" />
      <Header onGoBack={onGoBack} />
      <PatientSectionHeader name="General Information" />
      <PatientPersonalInfoForm />
    </FullView>
  );
};
