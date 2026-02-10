import React, { useEffect } from 'react';
import styled, { css } from 'styled-components';
import { useLocation } from 'react-router';
import { formatISO, isSameDay, isSameMonth, parseISO } from 'date-fns';
import queryString from 'query-string';

import { isStartOfThisWeek } from '@tamanu/utils/dateTime';
import { useDateTimeFormat } from '@tamanu/ui-components';

import { MonthPicker } from '../../../components';
import { Colors } from '../../../constants';
import { CarouselComponents as CarouselGrid } from '../../scheduling/locationBookings/CarouselComponents';
import { FIRST_DISPLAYED_DAY_ID, THIS_WEEK_ID } from '../../../constants/locationAssignments';

const StyledHeaderRow = styled(CarouselGrid.HeaderRow)`
  block-size: 30px;

  & > * {
    border-bottom: max(0.0625rem, 1px) solid ${Colors.outline};
  }
`;

const StyledFirstHeaderCell = styled(CarouselGrid.FirstHeaderCell)`
  display: flex;
  align-items: center;
`;

const HeaderCell = styled(CarouselGrid.ColHeaderCell).attrs({ as: 'time' })`
  --base-font-weight: 400;
  color: ${({ $dim = false }) => ($dim ? Colors.midText : Colors.darkestText)};
  font-size: 11px;
  font-weight: var(--base-font-weight);
  line-height: 1.3;

  ${({ $isToday = false }) =>
    $isToday &&
    css`
      --base-font-weight: 500;
      background-color: ${Colors.primary} !important;
      color: ${Colors.white};
    `}
`;

const Weekday = styled.p`
  color: ${({ $isToday = false }) => ($isToday ? Colors.white : Colors.midText)};
  font-variant-caps: all-small-caps;
  font-weight: calc(var(--base-font-weight) + 100);
  letter-spacing: 0.1em;
  margin: 0;
`;

export const DayHeaderCell = ({ date, dim, ...props }) => {
  const { formatShort, formatWeekdayShort, getCurrentDate } = useDateTimeFormat();
  const isToday = isSameDay(date, parseISO(getCurrentDate()));
  return (
    <HeaderCell
      $dim={dim}
      $isToday={isToday}
      dateTime={formatISO(date, { representation: 'date' })}
      {...props}
      data-testid="headercell-dpnh"
    >
      <Weekday $isToday={isToday} data-testid="weekday-i79b">
        {formatWeekdayShort(date)}
      </Weekday>
      {formatShort(date)}
    </HeaderCell>
  );
};

const StyledMonthPicker = styled(MonthPicker)`
  width: 100%;

  .MuiInputBase-root,
  .MuiInputBase-input {
    font-size: 11px;
  }

  body:has(&) > .MuiPickersPopper-root {
    z-index: 2; // Above the sticky headers
  }
`;

export const LocationAssignmentsCalendarHeader = ({ monthOf, setMonthOf, displayedDates }) => {
  const isFirstDisplayedDate = date => isSameDay(date, displayedDates[0]);

  const location = useLocation();
  useEffect(() => {
    const { date } = queryString.parse(location.search);
    if (date) {
      const parsedDate = parseISO(date);
      setMonthOf(parsedDate);
    }
  }, [location.search, setMonthOf]);

  return (
    <StyledHeaderRow data-testid="headerrow-afra">
      <StyledFirstHeaderCell data-testid="styledfirstheadercell-6j8e">
        <StyledMonthPicker
          value={monthOf}
          onChange={setMonthOf}
          data-testid="styledmonthpicker-4uml"
        />
      </StyledFirstHeaderCell>
      {displayedDates.map(d => {
        const id = isStartOfThisWeek(d)
          ? THIS_WEEK_ID
          : isFirstDisplayedDate(d)
          ? FIRST_DISPLAYED_DAY_ID
          : null;
        return (
          <DayHeaderCell
            date={d}
            dim={!isSameMonth(d, monthOf)}
            id={id}
            key={d.valueOf()}
            data-testid={`dayheadercell-abp0-${d.valueOf()}`}
          />
        );
      })}
    </StyledHeaderRow>
  );
};
