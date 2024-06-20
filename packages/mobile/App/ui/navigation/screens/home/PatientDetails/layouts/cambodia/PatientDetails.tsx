import React, { ReactElement, useCallback } from 'react';
import { GeneralInfo } from './GeneralInfo';
import { AdditionalInfo } from '../../CustomComponents/AdditionalInfo';
import { Routes } from '~/ui/helpers/routes';
import { joinNames } from '~/ui/helpers/user';
import { CAMBODIA_ADDITIONAL_DATA_SECTIONS } from './fields';

export const PatientDetails = ({ patient, navigation }): ReactElement => {
  const onEditGeneralInfo = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.Cambodia.EditPatient, {
      patientName: joinNames(patient),
    });
  }, [navigation, patient]);

  const editPatientAdditionalData = useCallback(
    (additionalData, sectionTitle, customPatientFieldValues, sectionKey) => {
      navigation.navigate(Routes.HomeStack.PatientDetailsStack.Cambodia.EditPatientAdditionalData, {
        patientName: joinNames(patient),
        patient,
        additionalDataJSON: JSON.stringify(additionalData),
        sectionTitle,
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
        dataSections={CAMBODIA_ADDITIONAL_DATA_SECTIONS}
      />
    </>
  );
};
