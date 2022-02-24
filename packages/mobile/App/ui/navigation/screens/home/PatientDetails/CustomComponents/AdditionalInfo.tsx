import React, { ReactElement } from 'react';

import { PatientAdditionalDataProps } from '/interfaces/PatientDetails';
import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from './PatientSection';

interface AdditionalInfoProps extends PatientAdditionalDataProps {
  onEdit: () => void;
}

export const AdditionalInfo = ({
  onEdit,
  patientAdditionalData: data,
}: AdditionalInfoProps): ReactElement => {
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

  return (
    <PatientSection
      hasSeparator
      title="Additional Information"
      onEdit={onEdit}
    >
      <FieldRowDisplay fields={fields} fieldsPerRow={2} />
    </PatientSection>
  );
};
