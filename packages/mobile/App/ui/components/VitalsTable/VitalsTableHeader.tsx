import React from 'react';
import { parseISO } from 'date-fns';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

export const vitalsTableHeader = {
  key: 'date',
  tableHeader: true,
  accessor: (date: Date): JSX.Element => (
    <StyledView
      // key={date}
      width={screenPercentageToDP(20.68, Orientation.Width)}
      height={screenPercentageToDP(4.86, Orientation.Height)}
      justifyContent="center"
      alignItems="center"
      background={theme.colors.MAIN_SUPER_DARK}
    >
      <StyledText
        fontSize={screenPercentageToDP(1.45, Orientation.Height)}
        fontWeight={600}
        color={theme.colors.WHITE}
      >
        {formatDate(parseISO(date), DateFormats.DDMMYY)}
      </StyledText>
      <StyledText
        fontSize={screenPercentageToDP(1.2, Orientation.Height)}
        fontWeight={600}
        color={theme.colors.WHITE}
      >
        {formatDate(parseISO(date), DateFormats.TIME)}
      </StyledText>
    </StyledView>
  ),
};
