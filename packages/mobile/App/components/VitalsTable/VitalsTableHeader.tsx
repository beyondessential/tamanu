import React from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { PatientVitalsProps } from '/interfaces/PatientVitalsProps';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';

export const vitalsTableHeader = {
  key: 'date',
  tableHeader: true,
  accessor: (row: PatientVitalsProps): JSX.Element => (
    <StyledView
      paddingTop={15}
      paddingBottom={15}
      width={85}
      height={40}
      justifyContent="center"
      alignItems="center"
      background={theme.colors.MAIN_SUPER_DARK}
    >
      <StyledText fontSize={12} fontWeight={700} color={theme.colors.WHITE}>
        {formatDate(row.date, DateFormats.DDMMYY)}
      </StyledText>
    </StyledView>
  ),
};
