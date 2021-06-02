import React, { ReactElement } from 'react';

import { PatientGeneralInformationDataProps } from '/interfaces/PatientDetails';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';

export const GeneralInfo = (
  data: PatientGeneralInformationDataProps,
): ReactElement => {
  const fields = [
    ['firstName', 'First name', data.generalInfo.firstName],
    ['middleName', 'Middle name', data.generalInfo.middleName || 'None'],

    ['lastName', 'Last name', data.generalInfo.lastName],
    ['culturalName', 'Cultural/tradition name', data.generalInfo.culturalName || 'None'],

    ['dateOfBirth', 'Date of Birth', formatDate(new Date(data.generalInfo.dateOfBirth), DateFormats.DDMMYY)],
    ['villageId', 'Village', data.generalInfo.village?.name ?? ''],
  ];

  return <FieldRowDisplay fields={fields} header="General Information" fieldsPerRow={2} />;
};
