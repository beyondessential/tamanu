import React, { ReactElement } from 'react';

import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from './PatientSection';

export const AdditionalInfo = ({
  data,
}): ReactElement => {
  const fields = [
    ['bloodType', data?.bloodType],
    ['title', data?.title],
    ['placeOfBirth', data?.placeOfBirth],
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
    ['educationLevel', data?.educationalLevel],
  ];

  return (
    <PatientSection hasSeparator title="Additional Information" onEdit={(): void => console.log('edit PatientAdditionalData')}>
      <FieldRowDisplay fields={fields} fieldsPerRow={2} />
    </PatientSection>
  );
};
