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
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

export const EditPatientScreen = ({ route }): ReactElement => {
  const { isEdit = true } = route.params;
  const navigation = useNavigation();
  const onGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <StatusBar barStyle="light-content" />
      <StackHeader
        title={
          isEdit ? (
            <TranslatedText stringId="patient.details.action.edit" fallback="Edit Patient" />
          ) : (
            <TranslatedText stringId="patient.register.title" fallback="Register New Patient" />
          )
        }
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
