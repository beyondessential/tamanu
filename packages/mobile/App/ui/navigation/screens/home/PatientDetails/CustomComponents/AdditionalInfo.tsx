import React, { ReactElement } from 'react';

import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from './PatientSection';

export const AdditionalInfo = ({
  data,
}): ReactElement => {
  const fields = [
    ['Blood Type', data.bloodType],
    ['Title', data.title],
    ['Place of Birth', data.placeOfBirth],
    ['Marital Status', data.maritalStatus],
    ['Primary Contact Number', data.primaryContactNumber],
    ['Secondary Contact Number', data.secondaryContactNumber],
    ['Social Media', data.socialMedia],
    ['Settlement', data.settlement?.name],
    ['Street/Village', data.streetVillage],
    ['City/Town', data.cityTown],
    ['Sub-division', data.subdivision?.name],
    ['Division', data.division?.name],
    ['Country', data.country?.name],
    ['Medical Area', data.medicalArea?.name],
    ['Nursing Zone', data.nursingZone?.name],
    ['Nationality', data.nationality?.name],
    ['Ethnicity', data.ethnicity?.name],
    ['Occupation', data.occupation?.name],
    ['Educational Attainment', data.educationalLevel],
  ];

  return (
    <PatientSection hasSeparator title="Additional Information" onEdit={(): void => console.log('edit PatientAdditionalData')}>
      <FieldRowDisplay fields={fields} fieldsPerRow={2} />
    </PatientSection>
  );
};
