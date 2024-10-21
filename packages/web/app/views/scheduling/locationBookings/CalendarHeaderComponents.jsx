import { formatISO, isSameDay, isSameMonth, isThisMonth, startOfToday } from 'date-fns';
import React, { useEffect } from 'react';
import styled, { css } from 'styled-components';

import { isStartOfThisWeek } from '@tamanu/shared/utils/dateTime';

import { Colors } from '../../../constants';
import { formatShort, formatWeekdayShort, MonthYearInput } from '../../../components';
import { CarouselComponents as CarouselGrid } from './CarouselComponents';

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

  .MuiInputAdornment-root {
    margin: 0;
  }

  body:has(&) > .MuiPickersPopper-root {
    z-index: 1; // Above the sticky headers
  }
`;

const thisWeekId = 'location-bookings-calendar__this-week';
const firstDisplayedDayId = 'location-bookings-calendar__beginning';

const scrollToThisWeek = () =>
  document.getElementById(thisWeekId)?.scrollIntoView({ inline: 'start' });
const scrollToBeginning = () =>
  document.getElementById(firstDisplayedDayId)?.scrollIntoView({ inline: 'start' });

export const LocationBookingsCalendarHeader = ({ selectedMonthState, displayedDates }) => {
  const [monthOf, setMonthOf] = selectedMonthState;
  const isFirstDisplayedDate = date => isSameDay(date, displayedDates[0]);
  useEffect(() => (isThisMonth(monthOf) ? scrollToThisWeek : scrollToBeginning)(), [monthOf]);

  return (
    <CarouselGrid.HeaderRow>
      <CarouselGrid.FirstHeaderCell>
        <MonthPicker onAccept={setMonthOf} />
      </CarouselGrid.FirstHeaderCell>
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
