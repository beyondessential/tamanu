import React, { ReactElement, useCallback } from 'react';
import { GeneralInfo } from './GeneralInfo';
import { AdditionalInfo } from '../../CustomComponents/AdditionalInfo';
import { Routes } from '~/ui/helpers/routes';
import { joinNames } from '~/ui/helpers/user';
import { GENERIC_ADDITIONAL_DATA_SECTIONS } from './fields';

export const PatientDetails = ({ patient, navigation }): ReactElement => {
  const onEditGeneralInfo = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.Generic.EditPatient, {
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
      navigation.navigate(Routes.HomeStack.PatientDetailsStack.Generic.EditPatientAdditionalData, {
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
      {/* Any required additional data fields are added here */}
      <AdditionalInfo
        patient={patient}
        onEdit={editPatientAdditionalData}
        dataSections={GENERIC_ADDITIONAL_DATA_SECTIONS}
      />
    </>
  );
};
