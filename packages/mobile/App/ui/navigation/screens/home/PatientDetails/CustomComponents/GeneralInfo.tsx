import React, { ReactElement } from 'react';

import { PatientGeneralInformationDataProps } from '/interfaces/PatientDetails';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from './PatientSection';

export const GeneralInfo = (
  data: PatientGeneralInformationDataProps,
): ReactElement => {
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
      onEdit={(): void => console.log('edit Patient')}
    >
      <FieldRowDisplay fields={fields} fieldsPerRow={2} />
    </PatientSection>
  );
};
