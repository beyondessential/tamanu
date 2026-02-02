import React from 'react';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import styled from 'styled-components';
import { TableHeader } from '../Table';
import { DateDisplay, TimeDisplay } from '../DateDisplay';

const VitalsHeaderWrapper = styled(StyledView)`
  width: ${screenPercentageToDP(23.68, Orientation.Width)}px;
  height: ${screenPercentageToDP(6.86, Orientation.Height)}px;
  justify-content: center;
  align-items: center;
  background: ${theme.colors.WHITE};
  border-color: ${theme.colors.BOX_OUTLINE};
  border-bottom-width: 1px;
`;

const VitalsDateHeader = ({ date }: { date: string }) => (
  <VitalsHeaderWrapper>
    <DateDisplay
      date={date}
      fontSize={screenPercentageToDP(1.45, Orientation.Height)}
      fontWeight={500}
      color="#326699"
    />
    <TimeDisplay
      date={date}
      fontSize={screenPercentageToDP(1.2, Orientation.Height)}
      fontWeight={500}
      color="#326699"
    />
  </VitalsHeaderWrapper>
);

export const vitalsTableHeader: TableHeader = {
  key: 'date',
  accessor: (date) => <VitalsDateHeader date={date} />,
};
