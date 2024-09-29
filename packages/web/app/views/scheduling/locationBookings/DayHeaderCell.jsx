import { formatISO } from 'date-fns';
import React from 'react';
import styled from 'styled-components';

import { Colors } from '../../../constants';
import { formatShort, formatWeekdayShort } from '../../../components';
import { CalendarColumnHeader } from './TableComponents';

const StyledHeader = styled(CalendarColumnHeader)`
  color: ${Colors.darkestText};
  font-size: 1.15rem;
  line-height: 1.3;
`;

const Weekday = styled.div`
  color: ${Colors.midText};
  font-variant-caps: all-small-caps;
  font-weight: 500;
  letter-spacing: 0.1em;
`;

export const DayHeaderCell = ({ date }) => {
  return (
    <StyledHeader>
      <time dateTime={formatISO(date, { representation: 'date' })}>
        <Weekday>{formatWeekdayShort(date)}</Weekday>
        {formatShort(date)}
      </time>
    </StyledHeader>
  );
};
