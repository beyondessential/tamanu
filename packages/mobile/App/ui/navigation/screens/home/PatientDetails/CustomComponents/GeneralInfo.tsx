import React, { ReactElement } from 'react';

import { PatientGeneralInformationDataProps } from '/interfaces/PatientDetails';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';

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
    // TODO: add Patient fields here
  ];

  return <FieldRowDisplay fields={fields} header="General Information" fieldsPerRow={2} />;
};
