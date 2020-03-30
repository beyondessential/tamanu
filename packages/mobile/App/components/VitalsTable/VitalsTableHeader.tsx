import React from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { PatientVitalsProps } from '/interfaces/PatientVitalsProps';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

export const vitalsTableHeader = {
  key: 'date',
  tableHeader: true,
  accessor: (row: PatientVitalsProps): JSX.Element => (
    <StyledView
      width={screenPercentageToDP(20.68, Orientation.Width)}
      height={screenPercentageToDP(4.86, Orientation.Height)}
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
