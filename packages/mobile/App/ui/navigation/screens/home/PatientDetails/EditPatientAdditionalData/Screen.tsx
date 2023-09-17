import React, { useCallback, ReactElement } from 'react';
import { StatusBar } from 'react-native';
import { FullView } from '/styled/common';
import { StackHeader } from '~/ui/components/StackHeader';
import { PatientAdditionalDataForm } from '/components/Forms/PatientAdditionalDataForm';
import { theme } from '/styled/theme';

export const EditPatientAdditionalDataScreen = ({ navigation, route }): ReactElement => {
  const {
    patientId,
    patientName,
    additionalDataJSON,
    sectionTitle,
    isCustomFields,
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
        title="Edit Patient Additional Data"
        subtitle={patientName}
        onGoBack={onGoBack}
      />
      <PatientAdditionalDataForm
        patientId={patientId}
        additionalData={additionalData}
        navigation={navigation}
        sectionTitle={sectionTitle}
        isCustomFields={isCustomFields}
        customSectionFields={customSectionFields}
        customPatientFieldValues={customPatientFieldValues}
      />
    </FullView>
  );
};
