import React, { ReactElement } from 'react';

import { PatientGeneralInformationDataProps } from '/interfaces/PatientDetails';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';

export const GeneralInfo = (
  data: PatientGeneralInformationDataProps,
): ReactElement => {
  const fields = [
    ['First name', data.generalInfo.firstName],
    ['Middle name', data.generalInfo.middleName || 'None'],

    ['Last name', data.generalInfo.lastName],
    ['Cultural/tradition name', data.generalInfo.culturalName || 'None'],

    ['Date of Birth', formatDate(new Date(data.generalInfo.dateOfBirth), DateFormats.DDMMYY)],
    ['Village', data.generalInfo.village?.name ?? ''],
  ];

  return <FieldRowDisplay fields={fields} header="General Information" fieldsPerRow={2} />;
};
