import React, { ReactElement, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { FullView } from '/styled/common';
import { StackHeader } from '~/ui/components/StackHeader';
import { PatientPersonalInfoForm } from '/components/Forms/NewPatientForm/PatientPersonalInfoForm';
import { theme } from '/styled/theme';
import { NameSection } from '~/ui/components/Forms/NewPatientForm/PatientPersonalInfoForm/NameSection';
import { KeyInformationSection } from '~/ui/components/Forms/NewPatientForm/PatientPersonalInfoForm/KeyInformationSection';
import { LocationDetailsSection } from '~/ui/components/Forms/NewPatientForm/PatientPersonalInfoForm/LocationDetailsSection';
import { PatientAdditionalDataFields } from '~/ui/components/Forms/PatientAdditionalDataForm/PatientAdditionalDataFields';
import { ALL_ADDITIONAL_DATA_FIELDS } from '~/ui/helpers/additionalData';

export const EditPatientScreen = ({ route, isEdit = true }): ReactElement => {
  const navigation = useNavigation();
  const onGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <StatusBar barStyle="light-content" />
      <StackHeader
        title={`${isEdit ? 'Edit' : 'New'} Patient`}
        subtitle={route?.params?.patientName}
        onGoBack={onGoBack}
      />
      <PatientPersonalInfoForm isEdit={isEdit}>
        <NameSection />
        <KeyInformationSection />
        <LocationDetailsSection />
        <PatientAdditionalDataFields fields={ALL_ADDITIONAL_DATA_FIELDS} showMandatory />
      </PatientPersonalInfoForm>
    </FullView>
  );
};
