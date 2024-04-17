import React, { ReactElement, useCallback } from 'react';
import { StatusBar } from 'react-native';
import { FullView } from '/styled/common';
import { StackHeader } from '~/ui/components/StackHeader';
import { PatientAdditionalDataForm } from '/components/Forms/PatientAdditionalDataForm';
import { theme } from '/styled/theme';
import { PatientSectionHeader } from '~/ui/components/Forms/NewPatientForm/PatientSectionHeader';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { additionalDataSections } from '~/ui/helpers/additionalData';

export const EditPatientAdditionalDataScreen = ({ navigation, route }): ReactElement => {
  const {
    patientName,
    additionalDataJSON,
    sectionTitle,
    customSectionFields,
    customPatientFieldValues,
  } = route.params;
  // additionalDataJSON might be undefined if record doesn't exist,
  // JSON.parse will break if it doesn't get a JSON object
  const additionalData = additionalDataJSON && JSON.parse(additionalDataJSON);

  const onGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

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
        additionalData={additionalData}
        additionalDataSections={additionalDataSections}
        navigation={navigation}
        sectionTitle={sectionTitle}
        customSectionFields={customSectionFields}
        customPatientFieldValues={customPatientFieldValues}
      />
    </FullView>
  );
};
