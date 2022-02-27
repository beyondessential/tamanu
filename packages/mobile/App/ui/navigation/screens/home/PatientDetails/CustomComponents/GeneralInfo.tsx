import React, { ReactElement } from 'react';

import { PatientGeneralInformationDataProps } from '/interfaces/PatientDetails';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from './PatientSection';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';

interface GeneralInfoProps extends PatientGeneralInformationDataProps {
  onEdit: () => void;
}

export const GeneralInfo = ({
  onEdit,
  ...data
}: GeneralInfoProps): ReactElement => {
  const fields = [
    ['firstName', data.generalInfo.firstName],
    ['middleName', data.generalInfo.middleName || 'None'],
    ['lastName', data.generalInfo.lastName],
    ['culturalName', data.generalInfo.culturalName || 'None'],
    ['dateOfBirth', formatDate(new Date(data.generalInfo.dateOfBirth), DateFormats.DDMMYY)],
    ['villageId', data.generalInfo.village?.name ?? ''],
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
