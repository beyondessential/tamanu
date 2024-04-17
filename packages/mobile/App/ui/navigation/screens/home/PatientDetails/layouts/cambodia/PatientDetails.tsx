import React, { ReactElement, useCallback } from 'react';
import { GeneralInfo } from './GeneralInfo';
import { AdditionalInfo } from './AdditionalInfo';
import { Routes } from '~/ui/helpers/routes';
import { joinNames } from '~/ui/helpers/user';

// TODO: declare navigation to cambodia specific forms

export const PatientDetails = ({ patient, navigation }): ReactElement => {
  const onEditGeneralInfo = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.Cambodia.EditPatient, {
      patientName: joinNames(patient),
    });
  }, [navigation, patient]);

  const editPatientAdditionalData = useCallback(
    (
      additionalData,
      sectionTitle,
      isCustomFields,
      customSectionFields,
      customPatientFieldValues,
    ) => {
      navigation.navigate(Routes.HomeStack.PatientDetailsStack.Cambodia.EditPatientAdditionalData, {
        patientId: patient.id,
        patientName: joinNames(patient),
        patient,
        additionalDataJSON: JSON.stringify(additionalData),
        sectionTitle,
        isCustomFields,
        customSectionFields,
        customPatientFieldValues,
      });
    },
    [navigation, patient],
  );

  return (
    <>
      <GeneralInfo patient={patient} onEdit={onEditGeneralInfo} />
      <AdditionalInfo patient={patient} onEdit={editPatientAdditionalData} />
    </>
  );
};
