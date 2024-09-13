import React from 'react';
import styled from 'styled-components';

import { formatWeekdayShort } from '../../../components';
import { CalendarColumnHeader } from './TableComponents';

const StyledHeader = styled(CalendarColumnHeader)`
  font-variant-caps: all-small-caps;
  letter-spacing: 0.1em;
  font-weight: 450;
`;

export const DayHeaderCell = ({ date }) => {
  return (
    <StyledHeader>
      <time dateTime={date.toISOString()}>{formatWeekdayShort(date)}</time>
    </StyledHeader>
  );
};
