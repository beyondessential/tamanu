import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import React, { useState } from 'react';
import styled from 'styled-components';

import { useLocationBookingsQuery } from '../../../api/queries';
import { Colors } from '../../../constants/index';
import { CarouselComponents as CarouselGrid } from './CarouselComponents';
import { LocationBookingsCalendarHeader } from './CalendarHeaderComponents';
import { SkeletonRows } from './Skeletons';
import { BookingsRow } from './CalendarBodyComponents';
import { partitionAppointmentsByLocation } from './util';

const getDisplayableDates = date => {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

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

const StyledRow = styled(CarouselGrid.Row)`
  color: ${Colors.primary};
  font-weight: 500;
  grid-template-columns: initial;
  place-items: center;
  margin-block: 0.5rem;
`;

const EmptyStateRow = () => (
  <StyledRow>No bookings to display. Please try adjusting the search filters.</StyledRow>
);

export const LocationBookingsCalendar = ({ locationsQuery }) => {
  const selectedMonthState = useState(startOfToday());
  const [monthOf] = selectedMonthState;
  const displayedDates = getDisplayableDates(monthOf);

  const { data: locations, isLoading: locationsAreLoading } = locationsQuery;

  const appointments =
    useLocationBookingsQuery({
      after: displayedDates[0],
      before: endOfDay(displayedDates[displayedDates.length - 1]),
    }).data?.data ?? [];
  console.log(appointments);
  const appointmentsByLocation = partitionAppointmentsByLocation(appointments);

  return (
    <Carousel>
      <CarouselGrid.Root $dayCount={displayedDates.length}>
        <LocationBookingsCalendarHeader
          selectedMonthState={selectedMonthState}
          displayedDates={displayedDates}
        />
        {locationsAreLoading ? (
          <SkeletonRows colCount={displayedDates.length} />
        ) : locations?.length === 0 ? (
          <EmptyStateRow />
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
  );
};
