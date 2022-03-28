import React, { ReactElement } from 'react';

import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from './PatientSection';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { getGender } from '~/ui/helpers/user';
import { IPatient } from '~/types';

interface GeneralInfoProps {
  onEdit: () => void;
  patient: IPatient;
}

export const GeneralInfo = ({
  onEdit,
  patient,
}: GeneralInfoProps): ReactElement => {
  const fields = [
    ['firstName', patient.firstName],
    ['middleName', patient.middleName || 'None'],
    ['lastName', patient.lastName],
    ['culturalName', patient.culturalName || 'None'],
    ['sex', getGender(patient.sex)],
    ['dateOfBirth', formatDate(new Date(patient.dateOfBirth), DateFormats.DDMMYY)],
    ['email', patient.email],
    ['villageId', patient.village?.name ?? ''],
  ];

  // Check if patient information should be editable
  const { getBool } = useLocalisation();
  const isEditable = getBool('features.editPatientDetailsOnMobile');

  return (
    <PatientSection
      hasSeparator={false}
      title="General Information"
      onEdit={isEditable ? onEdit : undefined}
    >
      <FieldRowDisplay fields={fields} fieldsPerRow={2} />
    </PatientSection>
  );
};
