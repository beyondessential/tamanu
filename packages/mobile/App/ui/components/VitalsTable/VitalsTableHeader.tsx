import React, { ReactElement } from 'react';
import { parseISO } from 'date-fns';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { DateFormats } from '/helpers/constants';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import styled from 'styled-components';
import { TableHeader } from '../Table';
import { useDateFormatter } from '~/ui/hooks/useDateFormatter';

const VitalsHeaderWrapper = styled(StyledView)`
  width: ${screenPercentageToDP(23.68, Orientation.Width)}px;
  height: ${screenPercentageToDP(6.86, Orientation.Height)}px;
  justify-content: center;
  align-items: center;
  background: ${theme.colors.WHITE};
  border-color: ${theme.colors.BOX_OUTLINE};
  border-bottom-width: 1px;
`;

const VitalsHeaderCell = ({ date }: { date: string }): ReactElement => {
  const { formatDate } = useDateFormatter();
  return (
    <VitalsHeaderWrapper>
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
  );
};

export const vitalsTableHeader: TableHeader = {
  key: 'date',
  accessor: (date) => <VitalsHeaderCell date={date} />,
};
