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

import { useAppointmentsQuery } from '../../../api/queries';
import { APPOINTMENT_CALENDAR_CLASS, TranslatedText } from '../../../components';
import { Colors } from '../../../constants';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { CarouselComponents as CarouselGrid } from './CarouselComponents';
import { LocationBookingsCalendarBody } from './LocationBookingsCalendarBody';
import { LocationBookingsCalendarHeader } from './LocationBookingsCalendarHeader';
import { partitionAppointmentsByLocation } from './utils';

const getDisplayableDates = date => {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

const EmptyState = styled.div`
  --border-style: max(0.0625rem, 1px) solid ${Colors.outline};
  background-color: ${Colors.white};
  border-block-end: var(--border-style);
  border-end-end-radius: 0.2rem;
  border-end-start-radius: 0.2rem;
  border-inline: var(--border-style);
  color: ${Colors.primary};
  font-weight: 500;
  margin-inline: 1rem;
  padding-block: 0.75rem;
  padding-inline: 0.5rem;
  text-align: center;
`;

const Carousel = styled.div`
  background-color: ${Colors.white};
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  border-radius: 0.2rem;
  display: grid;
  grid-template-rows: 1fr auto;
  margin: 1rem;
  max-block-size: 100%;
  overflow: scroll;
  overscroll-behavior: contain;
  // Uncomment line below to re-enable scroll snap. Components in CarouselComponents still support
  // scroll snap, but disabling because Chrome’s current handling of scrolling by clicking-and-
  // holding scrollbar arrows doesn’t respect the final scroll offset. It jumps back to the original
  // scroll offset.
  // scroll-snap-type: both mandatory;

  /*
   * Make the empty state message superficially look like a row in the table. (Empty state message
   * is a sibling, not child, to prevent its text from scrolling off-screen.
   */
  &:has(+ ${EmptyState}) {
    border-end-end-radius: 0;
    border-end-start-radius: 0;
    margin-block-end: 0;
  }

  @media (prefers-reduced-motion: no-preference) {
    scroll-behavior: smooth;
  }
`;

const emptyStateMessage = (
  <EmptyState>
    <TranslatedText
      stringId="locationBooking.calendar.noMatchingBookings"
      fallback="No bookings to display. Please try adjusting the search filters."
    />
  </EmptyState>
);

export const LocationBookingsCalendar = ({ locationsQuery, openBookingForm, openCancelModal }) => {
  const selectedMonthState = useState(startOfToday());
  const [monthOf] = selectedMonthState;
  const displayedDates = getDisplayableDates(monthOf);

  const {
    filters: { bookingTypeId, clinicianId, patientNameOrId },
  } = useLocationBookingsContext();
  // When filtering only by location, don’t hide locations that contain no appointments
  const areNonLocationFiltersActive =
    clinicianId?.length > 0 || bookingTypeId?.length > 0 || !!patientNameOrId;
  const { data: locations } = locationsQuery;

  const { data: appointmentsData } = useAppointmentsQuery({
    after: displayedDates[0],
    before: endOfDay(displayedDates.at(-1)),
    all: true,
    locationId: '',
    clinicianId,
    bookingTypeId,
    patientNameOrId,
  });
  const appointments = appointmentsData?.data ?? [];
  const appointmentsByLocation = partitionAppointmentsByLocation(appointments);

  const filteredLocations = areNonLocationFiltersActive
    ? locations?.filter(location => appointmentsByLocation[location.id])
    : locations;

  return (
    <>
      <Carousel className={APPOINTMENT_CALENDAR_CLASS}>
        <CarouselGrid.Root $dayCount={displayedDates.length}>
          <LocationBookingsCalendarHeader
            selectedMonthState={selectedMonthState}
            displayedDates={displayedDates}
          />
          <LocationBookingsCalendarBody
            appointmentsByLocation={appointmentsByLocation}
            displayedDates={displayedDates}
            filteredLocations={filteredLocations}
            locationsQuery={locationsQuery}
            openBookingForm={openBookingForm}
            openCancelModal={openCancelModal}
          />
        </CarouselGrid.Root>
      </Carousel>
      {filteredLocations?.length === 0 && emptyStateMessage}
    </>
  );
};
