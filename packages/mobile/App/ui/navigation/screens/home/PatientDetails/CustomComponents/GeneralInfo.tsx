import React, { ReactElement } from 'react';
import { PatientGeneralInformationDataProps } from '/interfaces/PatientDetails';
import { StyledView, RowView } from '/styled/common';
import { SectionHeader } from '/components/SectionHeader';
import { InformationBox } from './InformationBox';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';

export const GeneralInfo = (
  data: PatientGeneralInformationDataProps,
): ReactElement => (
  <StyledView width="100%">
    <SectionHeader h1 fontWeight={500}>
      General Information
    </SectionHeader>
    <RowView marginTop={20}>
      <InformationBox
        flex={1}
        title="First name"
        info={data.generalInfo.firstName}
      />
      <InformationBox
        flex={1}
        title="Middle name"
        info={data.generalInfo.middleName || 'None'}
      />
    </RowView>
    <RowView marginTop={20}>
      <InformationBox
        flex={1}
        title="Last name"
        info={data.generalInfo.lastName}
      />
      <InformationBox
        flex={1}
        title="Cultural/tradition name"
        info={data.generalInfo.culturalName || 'None'}
      />
    </RowView>
    <RowView marginTop={20}>
      <InformationBox
        flex={1}
        title="Date of Birth"
        info={formatDate(new Date(data.generalInfo.dateOfBirth), DateFormats.DDMMYY)}
      />
      <InformationBox flex={1} title="Blood type" info="B+" />
    </RowView>
  </StyledView>
);
