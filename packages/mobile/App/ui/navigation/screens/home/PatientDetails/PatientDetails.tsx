import React, { ReactElement, useCallback } from 'react';
import { GeneralInfo } from './GeneralInfo';
import { AdditionalInfo } from './CustomComponents/AdditionalInfo';
import { Routes } from '~/ui/helpers/routes';
import { joinNames } from '~/ui/helpers/user';
import { ADDITIONAL_DATA_SECTIONS } from './fields';
import { useSettings } from '~/ui/contexts/SettingsContext';
import { ADDITIONAL_DATA_SECTIONS_WITH_ADDRESS_HIERARCHY } from './fields';

export const PatientDetails = ({ patient, navigation }): ReactElement => {
  const { getSetting } = useSettings();

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

  const isUsingAddressHierarchy = getSetting<boolean>('features.patientDetailsLocationHierarchy');

  return (
    <>
      <GeneralInfo patient={patient} onEdit={onEditGeneralInfo} />
      {/* Any required additional data fields are added here */}
      <AdditionalInfo
        patient={patient}
        onEdit={editPatientAdditionalData}
        dataSections={
          isUsingAddressHierarchy
            ? ADDITIONAL_DATA_SECTIONS_WITH_ADDRESS_HIERARCHY
            : ADDITIONAL_DATA_SECTIONS
        }
      />
    </>
  );
};
