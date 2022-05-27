import React, { ReactElement, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { FieldRowDisplay } from '../../../../../components/FieldRowDisplay';
import { ErrorScreen } from '../../../../../components/ErrorScreen';
import { LoadingScreen } from '../../../../../components/LoadingScreen';
import { PatientSection } from './PatientSection';
import { useLocalisation } from '../../../../../contexts/LocalisationContext';
import { IPatient, IPatientAdditionalData } from '../../../../../../types';
import { useBackend } from '../../../../../hooks';

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

  // Display general error
  if (error) {
    return <ErrorScreen error={error} />;
  }

  const data = additionalDataRes && additionalDataRes[0];
  function editInfo(): void {
    onEdit(data);
  }

  const identificationFields = [
    ['birthCertificate', data?.birthCertificate],
    ['drivingLicense', data?.drivingLicense],
    ['passport', data?.passport],
  ];

  const contactFields = [
    ['primaryContactNumber', data?.primaryContactNumber],
    ['secondaryContactNumber', data?.secondaryContactNumber],
    ['emergencyContactName', data?.emergencyContactName],
    ['emergencyContactNumber', data?.emergencyContactNumber],
  ];

  const personalFields = [
    ['title', data?.title],
    ['maritalStatus', data?.maritalStatus],
    ['bloodType', data?.bloodType],
    ['placeOfBirth', data?.placeOfBirth],
    ['countryOfBirthId', data?.countryOfBirth?.name],
    ['nationalityId', data?.nationality?.name],
    ['ethnicityId', data?.ethnicity?.name],
    ['religionId', data?.religion?.name],
    ['educationalLevel', data?.educationalLevel],
    ['occupationId', data?.occupation?.name],
    ['socialMedia', data?.socialMedia],
    ['patientBillingTypeId', data?.patientBillingType?.name],
  ];

  const otherFields = [
    ['streetVillage', data?.streetVillage],
    ['cityTown', data?.cityTown],
    ['subdivisionId', data?.subdivision?.name],
    ['divisionId', data?.division?.name],
    ['countryId', data?.country?.name],
    ['settlementId', data?.settlement?.name],
    ['medicalAreaId', data?.medicalArea?.name],
    ['nursingZoneId', data?.nursingZone?.name],
  ];

  const sections = [
    { title: 'Identification information', fields: identificationFields },
    { title: 'Contact information', fields: contactFields },
    { title: 'Personal information', fields: personalFields },
    { title: 'Other information', fields: otherFields },
  ];

  // Check if patient additional data should be editable
  const { getBool } = useLocalisation();
  const isEditable = getBool('features.editPatientDetailsOnMobile');

  return (
    <>
      {sections.map(({ title, fields }) => {
        let content;
        if (loading) {
          content = <LoadingScreen />;
        } else {
          content = <FieldRowDisplay fields={fields} />;
        }

        return (
          <PatientSection
            title={title}
            onEdit={isEditable ? editInfo : undefined}
          >
            {content}
          </PatientSection>
        );
      })}
    </>
  );
};
