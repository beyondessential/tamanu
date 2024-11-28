import React, { useEffect } from 'react';
import styled, { css } from 'styled-components';
import { useLocation } from 'react-router-dom';
import { formatISO, isSameDay, isSameMonth, parseISO, startOfToday } from 'date-fns';
import queryString from 'query-string';

import { isStartOfThisWeek } from '@tamanu/shared/utils/dateTime';

import { Button, MonthYearInput, formatShort, formatWeekdayShort } from '../../../components';
import { Colors } from '../../../constants';
import { CarouselComponents as CarouselGrid } from './CarouselComponents';

export const thisWeekId = 'location-bookings-calendar__this-week';
export const firstDisplayedDayId = 'location-bookings-calendar__beginning';

const StyledFirstHeaderCell = styled(CarouselGrid.FirstHeaderCell)`
  display: grid;
  gap: 0.25rem;
  grid-template-columns: minmax(min-content, 1fr) max-content;
  align-items: center;
`;

const StyledButton = styled(Button).attrs({ variant: 'text' })`
  font-size: 0.75rem;
  font-weight: 400;
  min-inline-size: 4rem; // Prevent hover effect from affecting layout
  padding: 0.25rem;

  &:hover {
    background-color: initial;
    font-weight: 500;
  }

  &,
  &:hover {
    text-decoration-line: underline;
    text-decoration-thickness: from-font;
  }

  .MuiButton-label {
    display: contents;
  }
`;

const HeaderCell = styled(CarouselGrid.ColHeaderCell).attrs({ as: 'time' })`
  --base-font-weight: 400;
  color: ${({ $dim = false }) => ($dim ? Colors.midText : Colors.darkestText)};
  font-size: 1rem;
  font-weight: var(--base-font-weight);
  line-height: 1.3;

  ${({ $isToday = false }) =>
    $isToday &&
    css`
      --base-font-weight: 500;
      background-color: color-mix(in oklab, white 100%, ${Colors.primary} 10%);
    `}
`;

const Weekday = styled.p`
  color: ${Colors.midText};
  font-variant-caps: all-small-caps;
  font-weight: calc(var(--base-font-weight) + 100);
  letter-spacing: 0.1em;
  margin: 0;
`;

export const DayHeaderCell = ({ date, dim, ...props }) => {
  return (
    <HeaderCell
      $dim={dim}
      $isToday={isSameDay(date, startOfToday())}
      dateTime={formatISO(date, { representation: 'date' })}
      {...props}
    >
      <Weekday>{formatWeekdayShort(date)}</Weekday>
      {formatShort(date)}
    </HeaderCell>
  );
};

const MonthPicker = styled(MonthYearInput)`
  .MuiInputBase-root,
  .MuiInputBase-input {
    font-size: inherit;
  }

  body:has(&) > .MuiPickersPopper-root {
    z-index: 2; // Above the sticky headers
  }
`;

export const LocationBookingsCalendarHeader = ({ monthOf, setMonthOf, displayedDates }) => {
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
    <CarouselGrid.HeaderRow>
      <StyledFirstHeaderCell>
        <MonthPicker
          value={monthOf}
          onAccept={setMonthOf}
          onBlur={e => setMonthOf(new Date(e.target.value))}
          onKeyDown={e => {
            if (e.key === 'Enter') setMonthOf(new Date(e.target.value));
          }}
        />
        <StyledButton onClick={() => setMonthOf(startOfToday())}>This week</StyledButton>
      </StyledFirstHeaderCell>
      {displayedDates.map(d => {
        const id = isStartOfThisWeek(d)
          ? thisWeekId
          : isFirstDisplayedDate(d)
          ? firstDisplayedDayId
          : null;
        return <DayHeaderCell date={d} dim={!isSameMonth(d, monthOf)} id={id} key={d.valueOf()} />;
      })}
    </CarouselGrid.HeaderRow>
  );
};
