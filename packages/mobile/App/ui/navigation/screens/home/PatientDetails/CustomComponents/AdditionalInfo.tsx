import React, { ReactElement } from 'react';

import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from './PatientSection';

export const AdditionalInfo = ({
  data,
}): ReactElement => {
  const fields = [
    ['bloodType', 'Blood Type', data?.bloodType],
    ['title', 'Title', data?.title],
    ['placeOfBirth', 'Place of Birth', data?.placeOfBirth],
    ['maritalStatus', 'Marital Status', data?.maritalStatus],
    ['primaryContactNumber', 'Primary Contact Number', data?.primaryContactNumber],
    ['secondaryContactNumber', 'Secondary Contact Number', data?.secondaryContactNumber],
    ['socialMedia', 'Social Media', data?.socialMedia],
    ['settlementId', 'Settlement', data?.settlement?.name],
    ['streetVillage', 'Street/Village', data?.streetVillage],
    ['cityTown', 'City/Town', data?.cityTown],
    ['subdivisionId', 'Sub-division', data?.subdivision?.name],
    ['divisionId', 'Division', data?.division?.name],
    ['countryId', 'Country', data?.country?.name],
    ['medicalAreaId', 'Medical Area', data?.medicalArea?.name],
    ['nursingZoneId', 'Nursing Zone', data?.nursingZone?.name],
    ['nationalityId', 'Nationality', data?.nationality?.name],
    ['ethnicityId', 'Ethnicity', data?.ethnicity?.name],
    ['occupationId', 'Occupation', data?.occupation?.name],
    ['educationLevel', 'Educational Attainment', data?.educationalLevel],
  ];

  return (
    <PatientSection hasSeparator title="Additional Information" onEdit={(): void => console.log('edit PatientAdditionalData')}>
      <FieldRowDisplay fields={fields} fieldsPerRow={2} />
    </PatientSection>
  );
};
