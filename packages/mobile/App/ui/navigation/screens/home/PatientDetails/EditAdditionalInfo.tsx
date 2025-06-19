import React, { ReactElement, useCallback } from 'react';
import { StatusBar } from 'react-native';
import { FullView } from '/styled/common';
import { StackHeader } from '~/ui/components/StackHeader';
import { PatientAdditionalDataForm } from '/components/Forms/PatientAdditionalDataForm';
import { theme } from '/styled/theme';
import { PatientSectionHeader } from '~/ui/components/Forms/NewPatientForm/PatientSectionHeader';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import {
  ADDITIONAL_DATA_SECTIONS,
  ADDITIONAL_DATA_SECTIONS_WITH_ADDRESS_HIERARCHY,
} from './fields';
import { useSettings } from '~/ui/contexts/SettingsContext';

export const EditPatientAdditionalDataScreen = ({ navigation, route }): ReactElement => {
  const { getSetting } = useSettings();
  const {
    patientName,
    patient,
    additionalDataJSON,
    sectionTitle,
    isCustomSection,
    customSectionFields,
    customPatientFieldValues,
    sectionKey,
  } = route.params;
  // additionalDataJSON might be undefined if record doesn't exist,
  // JSON.parse will break if it doesn't get a JSON object
  const additionalData = additionalDataJSON && JSON.parse(additionalDataJSON);

  const onGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const isUsingAddressHierarchy = getSetting<boolean>('features.patientDetailsLocationHierarchy');

  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <StatusBar barStyle="light-content" />
      <StackHeader
        title={
          <TranslatedText
            stringId="patient.details.action.editAdditionalData"
            fallback="Edit Patient Additional Data"
          />
        }
        subtitle={patientName}
        onGoBack={onGoBack}
      />
      <PatientSectionHeader name={sectionTitle} />
      <PatientAdditionalDataForm
        patient={patient}
        additionalData={additionalData}
        additionalDataSections={
          isUsingAddressHierarchy
            ? ADDITIONAL_DATA_SECTIONS_WITH_ADDRESS_HIERARCHY
            : ADDITIONAL_DATA_SECTIONS
        }
        navigation={navigation}
        sectionTitle={sectionTitle}
        sectionKey={sectionKey}
        customSectionFields={customSectionFields}
        isCustomSection={isCustomSection}
        customPatientFieldValues={customPatientFieldValues}
      />
    </FullView>
  );
};
