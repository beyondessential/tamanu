import React, { ReactElement } from 'react';

import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { IPatientAdditionalData } from '~/types';
import { PatientSection } from './PatientSection';

export const AdditionalInfo = (
  data: IPatientAdditionalData,
): ReactElement => {
  const fields = [
    ['Place of Birth', data.placeOfBirth],
    ['Title', data.title],
    ['Blood Type', data.bloodType],
    ['Primary Contact Number', data.primaryContactNumber],
    ['Secondary Contact Number', data.secondaryContactNumber],
    ['Marital Status', data.maritalStatus],
    ['City/Town', data.cityTown],
    ['Street/Village', data.streetVillage],
    ['Educational Attainment', data.educationalLevel],
    ['Social Media', data.socialMedia],
    ['Nationality', data.nationality?.name],
    ['Country', data.country?.name],
    ['Division', data.division?.name],
    ['Sub Division', data.subdivision?.name],
    ['Medical Area', data.medicalArea?.name],
    ['Nursing Zone', data.nursingZone?.name],
    ['Settlement', data.settlement?.name],
    ['Ethnicity', data.ethnicity?.name],
    ['Occupation', data.occupation?.name],
  ];

  return (
    <PatientSection hasSeparator title="Additional Information" onEdit={(): void => console.log('edit PatientAdditionalData')}>
      <FieldRowDisplay fields={fields} fieldsPerRow={2} />
    </PatientSection>
  );
};
