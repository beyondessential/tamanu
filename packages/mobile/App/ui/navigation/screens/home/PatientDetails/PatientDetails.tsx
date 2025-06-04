import React, { ReactElement, useCallback } from 'react';
import { GeneralInfo } from './GeneralInfo';
import { AdditionalInfo } from './CustomComponents/AdditionalInfo';
import { Routes } from '~/ui/helpers/routes';
import { joinNames } from '~/ui/helpers/user';
import { ADDITIONAL_DATA_SECTIONS } from './fields';

export const PatientDetails = ({ patient, navigation }): ReactElement => {
  const onEditGeneralInfo = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.EditPatient, {
      patientName: joinNames(patient),
    });
  }, [navigation, patient]);

  const editPatientAdditionalData = useCallback(
    (
      additionalData,
      sectionTitle,
      isCustomSection,
      customSectionFields,
      customPatientFieldValues,
      sectionKey,
    ) => {
      navigation.navigate(Routes.HomeStack.PatientDetailsStack.EditPatientAdditionalData, {
        patientName: joinNames(patient),
        patient,
        additionalDataJSON: JSON.stringify(additionalData),
        sectionTitle,
        isCustomSection,
        customSectionFields,
        customPatientFieldValues,
        sectionKey,
      });
    },
    [navigation, patient],
  );

  return (
    <>
      <GeneralInfo patient={patient} onEdit={onEditGeneralInfo} />
      <AdditionalInfo
        patient={patient}
        onEdit={editPatientAdditionalData}
        dataSections={ADDITIONAL_DATA_SECTIONS}
      />
    </>
  );
};
