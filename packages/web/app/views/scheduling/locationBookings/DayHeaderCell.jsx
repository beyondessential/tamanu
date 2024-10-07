import { formatISO, isSameDay, startOfToday } from 'date-fns';
import React from 'react';
import styled, { css } from 'styled-components';

import { Colors } from '../../../constants';
import { formatShort, formatWeekdayShort } from '../../../components';
import { CalendarColHeaderCell } from './LocationBookingsCalendarGrid.jsx';

const StyledHeader = styled(CalendarColHeaderCell).attrs({ as: 'time' })`
  --base-font-weight: 400;
  color: ${({ $dim = false }) => ($dim ? Colors.midText : Colors.darkestText)};
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  font-weight: var(--base-font-weight);
  line-height: 1.3;
  place-content: center;

  ${({ $isToday = false }) =>
    $isToday &&
    css`
      --base-font-weight: 500;
      background-color: color-mix(in oklab, white 100%, ${Colors.primary} 10%);
    `}
`;

const Weekday = styled.div`
  color: ${Colors.midText};
  font-variant-caps: all-small-caps;
  font-weight: calc(var(--base-font-weight) + 100);
  letter-spacing: 0.1em;
`;

export const DayHeaderCell = ({ date, dim, ...props }) => {
  return (
    <StyledHeader
      $dim={dim}
      $isToday={isSameDay(date, startOfToday())}
      dateTime={formatISO(date, { representation: 'date' })}
      {...props}
    >
      <Weekday>{formatWeekdayShort(date)}</Weekday>
      {formatShort(date)}
    </StyledHeader>
  );
};
