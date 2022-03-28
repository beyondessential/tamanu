import React, { ReactElement, useCallback } from 'react';
import { useIsFocused } from '@react-navigation/native';

import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from './PatientSection';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { IPatient, IPatientAdditionalData } from '~/types';
import { useEffectWithBackend } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';

interface AdditionalInfoProps {
  onEdit: (additionalInfo: IPatientAdditionalData) => void;
  patient: IPatient;
}

export const AdditionalInfo = ({ patient, onEdit }: AdditionalInfoProps): ReactElement => {
  const isFocused = useIsFocused(); // reload data whenever the page is focused
  const [additionalDataRes, additionalDataError, additionalDataLoading] = useEffectWithBackend(
    useCallback(
      ({ models }) => models.PatientAdditionalData.find({
        where: { patient: { id: patient.id } },
      }),
      [patient.id],
    ),
    { shouldExecute: isFocused },
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
  ];

  // Check if patient additional data should be editable
  const { getBool } = useLocalisation();
  const isEditable = getBool('features.editPatientDetailsOnMobile');

  let additionalFields = null;
  if (additionalDataError) {
    additionalFields = <ErrorScreen error={additionalDataError} />;
  } else if (additionalDataLoading) {
    additionalFields = <LoadingScreen />;
  } else if (additionalDataRes) {
    additionalFields = <FieldRowDisplay fields={fields} fieldsPerRow={2} />;
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
