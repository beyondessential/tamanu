import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import React, { useState } from 'react';
import styled from 'styled-components';

import { Colors } from '../../../constants';
import { CarouselComponents as CarouselGrid } from './CarouselComponents';
import { LocationBookingsCalendarBody } from './LocationBookingsCalendarBody';
import { LocationBookingsCalendarHeader } from './LocationBookingsCalendarHeader';

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
  // Uncomment line below to re-enable scroll snap. Components in CarouselComponents still support
  // scroll snap, but disabling because Chrome’s current handling of scrolling by clicking-and-
  // holding scrollbar arrows doesn’t respect the final scroll offset. It jumps back to the original
  // scroll offset.
  // scroll-snap-type: both mandatory;

  @media (prefers-reduced-motion: no-preference) {
    scroll-behavior: smooth;
  }
`;

export const LocationBookingsCalendar = ({ locationsQuery, openBookingForm, openCancelModal }) => {
  const selectedMonthState = useState(startOfToday());
  const [monthOf] = selectedMonthState;
  const displayedDates = getDisplayableDates(monthOf);

  return (
    <Carousel>
      <CarouselGrid.Root $dayCount={displayedDates.length}>
        <LocationBookingsCalendarHeader
          selectedMonthState={selectedMonthState}
          displayedDates={displayedDates}
        />
        <LocationBookingsCalendarBody
          locationsQuery={locationsQuery}
          displayedDates={displayedDates}
          openBookingForm={openBookingForm}
          openCancelModal={openCancelModal}
        />
      </CarouselGrid.Root>
    </Carousel>
  );
};
