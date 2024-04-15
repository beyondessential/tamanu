import React, { ReactElement, useCallback } from 'react';
import { FullView, StyledScrollView } from '~/ui/styled/common';
import { CambodiaGeneralInfo } from './CambodiaGeneralInfo';
import { CambodiaAdditionalInfo } from './CambodiaAdditionalInfo';
import { theme } from '~/ui/styled/theme';
import { Routes } from '~/ui/helpers/routes';
import { joinNames } from '~/ui/helpers/user';
import { PatientIssues } from '../../CustomComponents';

// TODO: declare navigation to cambodia specific forms

export const CambodiaPatientDetails = ({ patient, navigation }): ReactElement => {
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
        additionalDataJSON: JSON.stringify(additionalData),
        sectionTitle,
        isCustomFields,
        customSectionFields,
        customPatientFieldValues,
      });
    },
    [navigation, patient],
  );

  const onEditPatientIssues = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.Cambodia.AddPatientIssue);
  }, [navigation]);

  return (
    <>
      <CambodiaGeneralInfo patient={patient} onEdit={onEditGeneralInfo} />
      <CambodiaAdditionalInfo patient={patient} onEdit={editPatientAdditionalData} />
    </>
  );
};
