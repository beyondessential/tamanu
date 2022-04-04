import React, { ReactElement } from 'react';
import { useIsFocused } from '@react-navigation/native';

import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from './PatientSection';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { IPatient, IPatientAdditionalData } from '~/types';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';

interface AdditionalInfoProps {
  onEdit: (additionalInfo: IPatientAdditionalData) => void;
  patient: IPatient;
}

export const AdditionalInfo = ({
  patient,
  onEdit,
}: AdditionalInfoProps): ReactElement => {
  const isFocused = useIsFocused(); // reload data whenever the page is focused
  const [additionalDataRes, additionalDataError] = useBackendEffect(
    ({ models }) => {
      if (isFocused) {
        return models.PatientAdditionalData.find({
          where: { patient: { id: patient.id } },
        });
      }
    },
    [isFocused, patient.id],
  );

  const data = additionalDataRes && additionalDataRes[0];
  function editInfo(): void {
    onEdit(data);
  }
  const fields = [
    ['birthCertificate', data?.birthCertificate],
    ['drivingLicense', data?.drivingLicense],
    ['passport', data?.passport],
    ['bloodType', data?.bloodType],
    ['title', data?.title],
    ['placeOfBirth', data?.placeOfBirth],
    ['countryOfBirthId', data?.countryOfBirth?.name],
    ['maritalStatus', data?.maritalStatus],
    ['primaryContactNumber', data?.primaryContactNumber],
    ['secondaryContactNumber', data?.secondaryContactNumber],
    ['socialMedia', data?.socialMedia],
    ['settlementId', data?.settlement?.name],
    ['streetVillage', data?.streetVillage],
    ['cityTown', data?.cityTown],
    ['subdivisionId', data?.subdivision?.name],
    ['divisionId', data?.division?.name],
    ['countryId', data?.country?.name],
    ['medicalAreaId', data?.medicalArea?.name],
    ['nursingZoneId', data?.nursingZone?.name],
    ['nationalityId', data?.nationality?.name],
    ['ethnicityId', data?.ethnicity?.name],
    ['occupationId', data?.occupation?.name],
    ['educationalLevel', data?.educationalLevel],
    ['religionId', data?.religion?.name],
    ['patientBillingTypeId', data?.patientBillingType?.name],
    ['emergencyContactName', data?.emergencyContactName],
    ['emergencyContactNumber', data?.emergencyContactNumber],
  ];

  // Check if patient additional data should be editable
  const { getBool } = useLocalisation();
  const isEditable = getBool('features.editPatientDetailsOnMobile');

  let additionalFields = null;
  if (additionalDataError) {
    additionalFields = <ErrorScreen error={additionalDataError} />;
  } else if (additionalDataRes) {
    additionalFields = <FieldRowDisplay fields={fields} fieldsPerRow={2} />;
  } else {
    additionalFields = <LoadingScreen />;
  }
  return (
    <PatientSection
      hasSeparator
      title="Additional Information"
      onEdit={isEditable ? editInfo : undefined}
    >
      {additionalFields}
    </PatientSection>
  );
};
