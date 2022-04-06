import React, { ReactElement, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from './PatientSection';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { IPatient, IPatientAdditionalData } from '~/types';
import { useBackend } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';

interface AdditionalInfoProps {
  onEdit: (additionalInfo: IPatientAdditionalData) => void;
  patient: IPatient;
}

export const AdditionalInfo = ({ patient, onEdit }: AdditionalInfoProps): ReactElement => {
  const backend = useBackend();
  const [additionalDataRes, setAdditionalDataRes] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async (): Promise<void> => {
        const { models } = backend;
        try {
          const result = await models.PatientAdditionalData.find({
            where: { patient: { id: patient.id } },
          });
          if (!mounted) {
            return;
          }
          setAdditionalDataRes(result);
          setLoading(false);
        } catch (err) {
          if (!mounted) {
            return;
          }
          setError(err);
          setLoading(false);
        }
      })();
      return (): void => {
        mounted = false;
      };
    }, [backend, patient.id]),
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
  if (error) {
    additionalFields = <ErrorScreen error={error} />;
  } else if (loading) {
    additionalFields = <LoadingScreen />;
  } else if (additionalDataRes) {
    additionalFields = <FieldRowDisplay fields={fields} />;
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
