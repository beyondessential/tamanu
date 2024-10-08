import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isThisMonth,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { isStartOfThisWeek } from '@tamanu/shared/utils/dateTime';

import { useLocationBookingsQuery, useLocationsQuery } from '../../../api/queries';
import { Colors } from '../../../constants';
import { MonthYearInput, PageContainer, TopBar, TranslatedText } from '../../../components';
import { CarouselComponents as CarouselGrid } from './CarouselComponents';
import { DayHeaderCell } from './CalendarHeaderComponents';
import { BookingsRow } from './CalendarBodyComponents';
import { SkeletonRows } from './Skeletons';
import { partitionAppointmentsByLocation } from './util';

// BEGIN PLACEHOLDERS

const Placeholder = styled.div`
  background-color: oklch(0% 0 0 / 3%);
  block-size: 100%;
  border: 1px solid oklch(0% 0 0 / 15%);
  border-radius: 0.2rem;
  color: oklch(0% 0 0 / 55%);
  display: grid;
  font-size: 1rem;
  padding: 0.5rem;
  place-items: center;
  text-align: center;
`;

// END PLACEHOLDERS

const thisWeekId = 'location-bookings-calendar__this-week';
const firstDisplayedDayId = 'location-bookings-calendar__beginning';

const scrollToThisWeek = () =>
  document.getElementById(thisWeekId)?.scrollIntoView({ inline: 'start' });
const scrollToBeginning = () =>
  document.getElementById(firstDisplayedDayId)?.scrollIntoView({ inline: 'start' });

const LocationBookingsTopBar = styled(TopBar).attrs({
  title: (
    <TranslatedText stringId="scheduling.locationBookings.title" fallback="Location bookings" />
  ),
})``;

const Wrapper = styled(PageContainer)`
  max-block-size: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
`;

const Filters = styled('search')`
  display: flex;
  gap: 1rem;
`;

const Carousel = styled.div`
  background-color: ${Colors.white};
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  border-radius: 0.2rem;
  margin: 1rem;
  overflow: scroll;
  overscroll-behavior: contain;
  scroll-snap-type: both mandatory;

  @media (prefers-reduced-motion: no-preference) {
    scroll-behavior: smooth;
  }
`;

const MonthPicker = styled(MonthYearInput)`
  body:has(&) > .MuiPickersPopper-root {
    z-index: 1; // Above the sticky headers
  }
`;

const getDisplayableDates = date => {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

export const LocationBookingsView = () => {
  const [monthOf, setMonthOf] = useState(startOfToday());
  const displayedDates = getDisplayableDates(monthOf);
  const isFirstDisplayedDate = date => isSameDay(date, displayedDates[0]);

  useEffect(() => (isThisMonth(monthOf) ? scrollToThisWeek : scrollToBeginning)(), [monthOf]);

  const appointments =
    useLocationBookingsQuery({
      after: displayedDates[0],
      before: endOfDay(displayedDates[displayedDates.length - 1]),
    }).data?.data ?? [];
  const { data: locations, isLoading: locationsAreLoading } = useLocationsQuery({
    includeLocationGroup: true,
  });

  const appointmentsByLocation = partitionAppointmentsByLocation(appointments);

  return (
    <Wrapper>
      <LocationBookingsTopBar>
        <Filters>
          <Placeholder>Search</Placeholder>
          <Placeholder>Area</Placeholder>
          <Placeholder>Clinician</Placeholder>
          <Placeholder>Type</Placeholder>
        </Filters>
      </LocationBookingsTopBar>
      {/* TODO: Extract <Carousel> into <LocationBookingsCalendar> */}
      <Carousel>
        <CarouselGrid.Root $dayCount={displayedDates.length}>
          <CarouselGrid.HeaderRow>
            <CarouselGrid.FirstHeaderCell>
              <MonthPicker onAccept={setMonthOf} />
            </CarouselGrid.FirstHeaderCell>
            {displayedDates.map(d => {
              const elementId = isStartOfThisWeek(d)
                ? thisWeekId
                : isFirstDisplayedDate(d)
                ? firstDisplayedDayId
                : null;
              return (
                <DayHeaderCell
                  date={d}
                  dim={!isSameMonth(d, monthOf)}
                  id={elementId}
                  key={d.valueOf()}
                />
              );
            })}
          </CarouselGrid.HeaderRow>
          {locationsAreLoading ? (
            <SkeletonRows colCount={displayedDates.length} />
          ) : (
            locations?.map(location => (
              <BookingsRow
                appointments={appointmentsByLocation[location.id] ?? []}
                dates={displayedDates}
                key={location.code}
                location={location}
              />
            ))
          )}
        </CarouselGrid.Root>
      </Carousel>
    </Wrapper>
  );
};
