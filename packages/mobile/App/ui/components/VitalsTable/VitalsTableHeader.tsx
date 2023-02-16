import React from 'react';
import { parseISO } from 'date-fns';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import styled from 'styled-components';
import { TableHeader } from '../Table';

const VitalsHeaderWrapper = styled(StyledView)`
  width: ${screenPercentageToDP(23.68, Orientation.Width)}px;
  height: ${screenPercentageToDP(6.86, Orientation.Height)}px;
  justify-content: center;
  align-items: center;
  background: ${theme.colors.WHITE};
  border-color: ${theme.colors.BOX_OUTLINE};
  border-bottom-width: 1px;
`;

export const vitalsTableHeader: TableHeader = {
  key: 'date',
  accessor: (date) => (
    <VitalsHeaderWrapper
    >
      <StyledText
        fontSize={screenPercentageToDP(1.45, Orientation.Height)}
        fontWeight={500}
        color="#326699"
      >
        {formatDate(parseISO(date), DateFormats.DDMMYY)}
      </StyledText>
      <StyledText
        fontSize={screenPercentageToDP(1.2, Orientation.Height)}
        fontWeight={500}
        color="#326699"
      >
        {formatDate(parseISO(date), DateFormats.TIME)}
      </StyledText>
    </VitalsHeaderWrapper>
  ),
};
