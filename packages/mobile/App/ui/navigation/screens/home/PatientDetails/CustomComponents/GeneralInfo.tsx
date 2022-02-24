import React, { ReactElement } from 'react';

import { PatientGeneralInformationDataProps } from '/interfaces/PatientDetails';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from './PatientSection';

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

  return (
    <PatientSection
      hasSeparator={false}
      title="General Information"
      onEdit={onEdit}
    >
      <FieldRowDisplay fields={fields} fieldsPerRow={2} />
    </PatientSection>
  );
};
